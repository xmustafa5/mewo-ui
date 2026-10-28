import { render, screen } from "@testing-library/react"
import { Vec3 } from "ogl"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DreamCat, createFog, fitView, followStep, packFog, reachPoint, stepFog, stirFog, stretchFor, turnToward, type Bounds } from "@/registry/mewo/ui/dream-cat"

describe("followStep", () => {
  it("jumps at once without smoothing and covers two thirds of the way in one time constant", () => {
    expect(followStep(0, 1 / 60)).toBe(1)
    expect(followStep(0.2, 0.2)).toBeCloseTo(1 - Math.exp(-1), 6)
    expect(followStep(0.2, 1 / 60)).toBeLessThan(followStep(0.2, 1 / 30))
  })
})

describe("fitView", () => {
  const bounds: Bounds = { min: [-1, 0, -0.5], max: [1, 2, 0.5] }
  const t = Math.tan((22 * Math.PI) / 360)

  it("fits the taller side with a margin, centred on the character", () => {
    const view = fitView(bounds, 1, 1)
    expect(view.x).toBe(0)
    expect(view.y).toBe(1)
    expect(view.distance).toBeCloseTo(1.12 / t, 6)
  })

  it("comes twice as close at zoom 2, and fits the width of a narrow box", () => {
    expect(fitView(bounds, 1, 2).distance).toBeCloseTo(fitView(bounds, 1, 1).distance / 2, 6)
    expect(fitView(bounds, 0.5, 1).distance).toBeCloseTo(1.12 / (t * 0.5), 6)
  })

  it("puts the character's middle where x and y say, at any zoom", () => {
    for (const zoom of [0.5, 1, 1.6]) {
      const view = fitView(bounds, 2, zoom, 1, 0)
      // the middle (0, 1) lands on the view's right edge and top edge
      expect(0 - view.x).toBeCloseTo(t * view.distance * 2, 6)
      expect(1 - view.y).toBeCloseTo(t * view.distance, 6)
    }
  })

  it("moves the same way as the numbers, so raising x always moves the character right and y down", () => {
    for (const zoom of [0.5, 1.6]) {
      expect(fitView(bounds, 1, zoom, 0.7).x).toBeLessThan(fitView(bounds, 1, zoom, 0.3).x)
      expect(fitView(bounds, 1, zoom, 0.5, 0.7).y).toBeGreaterThan(fitView(bounds, 1, zoom, 0.5, 0.3).y)
    }
  })
})

describe("turnToward", () => {
  const up = new Vec3(0, 1, 0)
  const right = new Vec3(1, 0, 0)
  const turned = (limit: number, amount: number) => up.clone().applyQuaternion(turnToward(up, right, limit, amount))

  it("turns all the way when the limit allows it", () => {
    const v = turned(Math.PI, 1)
    expect(v[0]).toBeCloseTo(1, 6)
    expect(v[1]).toBeCloseTo(0, 6)
  })

  it("stops at the limit, and scales by the amount", () => {
    expect(turned(Math.PI / 6, 1).angle(up)).toBeCloseTo(Math.PI / 6, 6)
    expect(turned(Math.PI, 0.5).angle(up)).toBeCloseTo(Math.PI / 4, 6)
  })

  it("does nothing at no amount, or toward the same direction", () => {
    expect(turned(Math.PI, 0).angle(up)).toBeCloseTo(0, 6)
    expect(up.clone().applyQuaternion(turnToward(up, up.clone().scale(3), Math.PI, 1)).angle(up)).toBeCloseTo(0, 6)
  })
})

describe("reachPoint", () => {
  const centre = new Vec3(0, 0, 0)

  it("is where the ray first meets the sphere", () => {
    const hit = reachPoint(new Vec3(0, 0, 5), new Vec3(0, 0, -1), centre, 1)
    expect([...hit]).toEqual([0, 0, 1])
  })

  it("is the ray's point nearest the centre when it passes by", () => {
    const near = reachPoint(new Vec3(3, 0, 5), new Vec3(0, 0, -1), centre, 1)
    expect([...near]).toEqual([3, 0, 0])
  })
})

describe("stretchFor", () => {
  it("keeps the arm as modelled within its length", () => {
    expect(stretchFor(0.5, 0.64, 0.44, 8)).toBe(1)
  })

  it("grows the forearm just enough to carry the hand's middle out to the distance, up to the cap", () => {
    const s = stretchFor(1.5, 0.64, 0.44, 8)
    expect(0.64 + 0.44 * (s - 1)).toBeCloseTo(1.5, 6)
    expect(stretchFor(50, 0.64, 0.44, 8)).toBe(8)
    expect(stretchFor(1.5, 0.64, 0.44, 1)).toBe(1)
  })
})

describe("createFog and packFog", () => {
  it("makes a grid shaped like the box, of about 9000 cells, still and full of fog", () => {
    const fog = createFog(16 / 9)
    expect(fog.width / fog.height).toBeCloseTo(16 / 9, 1)
    expect(fog.width * fog.height).toBeGreaterThan(8000)
    expect(fog.width * fog.height).toBeLessThan(10000)
    expect(fog.calm).toBe(true)
    expect(fog.rest.every((d) => d === 1)).toBe(true)
    expect(Array.from(fog.density)).toEqual(Array.from(fog.rest))
  })

  it("packs how much fog is left and its motion in box sizes a second, a cell per texel", () => {
    const fog = createFog(2)
    fog.density[3] = 0.25
    fog.u[3] = fog.width
    fog.v[3] = -fog.height / 2
    const texels = packFog(fog, new Float32Array(fog.width * fog.height * 4))
    expect(Array.from(texels.slice(12, 16))).toEqual([0.25, 1, -0.5, 1])
    expect(Array.from(texels.slice(0, 4))).toEqual([1, 0, 0, 1])
  })
})

describe("stirFog and stepFog", () => {
  it("costs nothing while calm", () => {
    const fog = createFog(1)
    expect(stepFog(fog, 1 / 60)).toBe(true)
    expect(Array.from(fog.density)).toEqual(Array.from(fog.rest))
  })

  it("carries the fog round the hand along with it", () => {
    const fog = createFog(1)
    stirFog(fog, 0.5, 0.5, 0.1, 1, 0, 1)
    const centre = Math.round(0.5 * (fog.height - 1)) * fog.width + Math.round(0.5 * (fog.width - 1))
    expect(fog.calm).toBe(false)
    // one box width a second, in cells a second
    expect(fog.u[centre]).toBeGreaterThan(fog.width * 0.5)
    expect(fog.u[0]).toBe(0)
  })

  it("thins the fog the hand moves through", () => {
    const fog = createFog(1)
    const centre = Math.round(0.5 * (fog.height - 1)) * fog.width + Math.round(0.5 * (fog.width - 1))
    const before = fog.density[centre]
    stirFog(fog, 0.5, 0.5, 0.1, 1, 0, 1)
    expect(fog.density[centre]).toBeLessThan(before * 0.75)
  })

  it("moves the fog, then settles back to rest within a few seconds", () => {
    const fog = createFog(1)
    stirFog(fog, 0.5, 0.5, 0.1, 1.5, -0.5, 1)
    stepFog(fog, 1 / 60)
    const moved = fog.density.some((d, i) => Math.abs(d - fog.rest[i]) > 0.01)
    expect(moved).toBe(true)
    let seconds = 0
    while (!stepFog(fog, 1 / 60) && seconds < 20) seconds += 1 / 60
    expect(seconds).toBeLessThan(10)
    expect(Array.from(fog.density)).toEqual(Array.from(fog.rest))
  })

  it("leaves the flow nearly free of sources and sinks after a step", () => {
    const fog = createFog(1)
    stirFog(fog, 0.5, 0.5, 0.12, 1, 1, 1)
    const before = divergence(fog)
    stepFog(fog, 1 / 60)
    expect(divergence(fog)).toBeLessThan(before * 0.5)
  })
})

/** The largest inflow or outflow of any cell inside the grid. */
function divergence(fog: ReturnType<typeof createFog>) {
  const { width: w, height: h, u, v } = fog
  let most = 0
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const c = j * w + i
      most = Math.max(most, Math.abs(0.5 * (u[c + 1] - u[c - 1] + v[c + w] - v[c - w])))
    }
  return most
}

describe("DreamCat", () => {
  beforeEach(() => {
    // jsdom has no WebGL: the component must render its root and stop there
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })
  afterEach(() => vi.restoreAllMocks())

  it("renders a root that fills its parent, with the className merged and no canvas", () => {
    const { container } = render(<DreamCat className="h-80" />)
    const root = container.querySelector("[data-slot=dream-cat]")
    expect(root).toBeInTheDocument()
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-80")
    expect(root).not.toHaveClass("h-full")
    expect(container.querySelector("canvas")).toBeNull()
  })

  it("is decorative without alt, an image with it", () => {
    const { rerender, container } = render(<DreamCat />)
    expect(container.querySelector("[role=img]")).toBeNull()
    rerender(<DreamCat alt="The mewo cat" />)
    expect(screen.getByRole("img", { name: "The mewo cat" })).toBeInTheDocument()
  })

  it("lays children above the character and passes other props through", () => {
    render(
      <DreamCat id="hero" data-testid="character">
        <h2>Hello</h2>
      </DreamCat>
    )
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument()
    expect(screen.getByTestId("character")).toHaveAttribute("id", "hero")
  })
})
