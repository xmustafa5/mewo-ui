import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DepthImage, blur, buildField, fieldSize, followStep, imageExtents, luminance, orbitAngle, orbitPoint } from "@/registry/mewo/ui/depth-image"

const options = { depthFromLight: 0, depthSmoothing: 0, depthContrast: 1, invertDepth: false }

describe("luminance", () => {
  it("weights red, green and blue as Rec. 709 does", () => {
    const lum = luminance([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255])
    expect(Array.from(lum, (v) => +v.toFixed(4))).toEqual([1, 0, 0.2126, 0.7152])
  })
})

describe("blur", () => {
  it("returns the map itself when there is nothing to blur", () => {
    const map = new Float32Array([0, 1, 0, 1])
    expect(blur(map, 2, 2, 0)).toBe(map)
  })

  it("keeps a flat map flat and spreads an impulse evenly without losing any of it", () => {
    const flat = blur(new Float32Array(9 * 9).fill(0.4), 9, 9, 1.5)
    for (const v of flat) expect(v).toBeCloseTo(0.4, 5)
    const impulse = new Float32Array(15 * 15)
    impulse[7 * 15 + 7] = 1
    const spread = blur(impulse, 15, 15, 1)
    expect(spread.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
    expect(spread[7 * 15 + 6]).toBeCloseTo(spread[7 * 15 + 8], 6)
    expect(spread[6 * 15 + 7]).toBeCloseTo(spread[7 * 15 + 6], 6)
    expect(spread[7 * 15 + 7]).toBeLessThan(1)
  })
})

describe("fieldSize", () => {
  it("is 512 texels across and follows the photo's aspect", () => {
    expect(fieldSize(1600, 1000)).toEqual({ w: 512, h: 320 })
    expect(fieldSize(1000, 1000)).toEqual({ w: 512, h: 512 })
  })
})

describe("buildField", () => {
  const w = 4
  const h = 5
  const lum = new Float32Array(w * h).map((_, i) => (i % w) / (w - 1))

  it("reads the bottom of the photo as near when depth comes from position only", () => {
    const { depth } = buildField(lum, null, w, h, options)
    expect(depth[0]).toBeCloseTo(0)
    expect(depth[2 * w]).toBeCloseTo(0.5)
    expect(depth[(h - 1) * w + 3]).toBeCloseTo(1)
  })

  it("reads brightness as near when depth comes from light only, and clamps the contrast", () => {
    const { depth } = buildField(lum, null, w, h, { ...options, depthFromLight: 1, depthContrast: 1.5 })
    expect(depth[0]).toBe(0)
    expect(depth[3]).toBe(1)
    expect(depth[1]).toBeCloseTo(0.25)
  })

  it("inverts, uses a supplied depth map, and leaves its inputs alone", () => {
    expect(buildField(lum, null, w, h, { ...options, invertDepth: true }).depth[0]).toBeCloseTo(1)
    const map = new Float32Array(w * h).fill(0.25)
    const field = buildField(lum, map, w, h, { ...options, invertDepth: true })
    expect(field.depth[7]).toBeCloseTo(0.75)
    expect(map[7]).toBe(0.25)
  })

  it("interleaves depth and the blurred detail luminance for the GPU", () => {
    const field = buildField(lum, null, w, h, options)
    const detail = blur(lum, w, h, 1)
    expect(field.rg).toHaveLength(w * h * 2)
    expect(field.rg[2 * 6]).toBe(field.depth[6])
    expect(field.rg[2 * 6 + 1]).toBe(detail[6])
  })

  it("smooths the depth by 2.3 texels per step", () => {
    const smooth = buildField(lum, null, w, h, { ...options, depthSmoothing: 1 })
    expect(Array.from(smooth.depth)).toEqual(Array.from(blur(buildField(lum, null, w, h, options).depth, w, h, 2.3)))
  })
})

describe("imageExtents", () => {
  it("covers the view or fits inside it", () => {
    expect(imageExtents(2, 1.5, "cover")).toEqual({ x: 2, y: 1 })
    expect(imageExtents(2, 1.5, "contain")).toEqual({ x: 1.5, y: 0.75 })
    expect(imageExtents(1, 1.5, "cover")).toEqual({ x: 1.5, y: 1.5 })
    expect(imageExtents(1, 1.5, "contain")).toEqual({ x: 1, y: 1 })
  })
})

describe("orbit", () => {
  it("is an ellipse 0.715 of half the width by 0.82 of half the height per unit of radius, counter-clockwise", () => {
    const start = orbitPoint(0, 0.6, 1.6)
    expect(start.x).toBeCloseTo(0.715 * 0.6 * 1.6)
    expect(start.y).toBeCloseTo(0)
    const quarter = orbitPoint(Math.PI / 2, 0.6, 1.6)
    expect(quarter.x).toBeCloseTo(0)
    expect(quarter.y).toBeCloseTo(0.82 * 0.6)
  })

  it("resumes from the angle that points at the light", () => {
    const point = orbitPoint(2.1, 0.6, 1.6)
    expect(orbitAngle(point.x, point.y, 0.6, 1.6)).toBeCloseTo(2.1)
    expect(orbitAngle(-0.5, 0.2, 0.6, 1.6)).toBeCloseTo(orbitAngle(-1, 0.4, 0.6, 1.6))
  })
})

describe("followStep", () => {
  it("covers `follow` of the way per 60 fps frame, at any frame rate", () => {
    expect(followStep(0.12, 1 / 60)).toBeCloseTo(0.12)
    const half = followStep(0.12, 1 / 120)
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(0.12)
    expect(followStep(1, 1 / 60)).toBe(1)
    expect(followStep(0, 1 / 60)).toBeGreaterThan(0)
  })
})

describe("DepthImage", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })
  afterEach(() => vi.restoreAllMocks())

  it("renders the root with the merged className and the fallback colour, and no canvas without WebGL", () => {
    render(<DepthImage className="h-64" data-testid="d" />)
    const root = screen.getByTestId("d")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "depth-image")
    expect(root).toHaveStyle({ background: "#171717" })
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("names the image for screen readers and layers children above it", () => {
    render(
      <DepthImage alt="A stone sculpture" fallbackColor="#222">
        <h2>Caption</h2>
      </DepthImage>
    )
    const root = screen.getByRole("img", { name: "A stone sculpture" })
    expect(root).toHaveStyle({ background: "#222" })
    expect(screen.getByText("Caption").parentElement).toHaveClass("relative", "z-1")
  })

  it("is decorative without alt", () => {
    render(<DepthImage data-testid="d" />)
    expect(screen.getByTestId("d")).not.toHaveAttribute("role")
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<DepthImage data-testid="d" />)
    const root = screen.getByTestId("d")
    rerender(<DepthImage data-testid="d" image="/other.jpg" depthMap="/depth.png" view="depth" fit="contain" paused dpr={2} lightColor="tomato" />)
    rerender(<DepthImage data-testid="d" image="/other.jpg" view="normal" autoOrbit={false} invertDepth depthSmoothing={0} />)
    expect(screen.getByTestId("d")).toBe(root)
  })
})
