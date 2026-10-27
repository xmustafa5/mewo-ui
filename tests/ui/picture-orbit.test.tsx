import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PictureOrbit, buildOrbit, orbitAt, pictureAspect } from "@/registry/mewo/ui/picture-orbit"

const pictures = Array.from({ length: 24 }, (_, i) => 0.6 + (i % 6) * 0.2)

describe("pictureAspect", () => {
  it("keeps a card's proportions between 0.6 and 1.7", () => {
    expect(pictureAspect(0.3)).toBe(0.6)
    expect(pictureAspect(1.2)).toBe(1.2)
    expect(pictureAspect(3)).toBe(1.7)
  })
})

describe("buildOrbit", () => {
  it("is the same for the same pictures", () => {
    expect(buildOrbit("wide", pictures)).toEqual(buildOrbit("wide", pictures))
  })

  it("keeps each layer's pictures at least its clearance out, and has pale cards without a picture", () => {
    const cards = buildOrbit("wide", pictures)
    expect(cards.some((c) => c.cls === 1 && c.img === -1)).toBe(true)
    for (const c of cards) if (c.layer === 0) expect(c.arc).toBeGreaterThanOrEqual(0.3 - 1e-9)
  })
})

describe("orbitAt", () => {
  const out = [0, 0, 0, 0]
  const cards = buildOrbit("wide", pictures)
  const card = cards.find((c) => c.cls === 0)!

  it("rises as the reader scrolls, at its layer's pace", () => {
    const [, a] = orbitAt("wide", card, 18, 0, 0, 0, 0, out) as [number, number]
    const [, b] = orbitAt("wide", card, 18.1, 0, 0, 0, 0, out) as [number, number]
    // a step that doesn't wrap: the card moves up by its layer's speed × the scroll
    if (Math.abs(a - b) < 0.5) expect(a - b).toBeCloseTo(0.0708, 3)
  })

  it("bows out around the middle and draws in towards the top and bottom", () => {
    const xs: [number, number][] = []
    for (let v = 17; v < 22; v += 0.02) {
      const [x, y] = orbitAt("wide", card, v, 0, 0, 0, 0, out) as [number, number]
      xs.push([Math.abs(y), Math.abs(x)])
    }
    const mid = Math.max(...xs.filter(([y]) => y < 0.05).map(([, x]) => x))
    const edge = Math.max(...xs.filter(([y]) => y > 0.45 && y < 0.5).map(([, x]) => x))
    expect(mid).toBeGreaterThan(edge)
  })

  it("leans away from the pointer", () => {
    const [still] = orbitAt("wide", card, 18, 0, 0, 0, 0, out) as [number]
    const [leaning] = orbitAt("wide", card, 18, 0, 0, 1, 0, out) as [number]
    expect(leaning).toBeLessThan(still)
  })
})

describe("PictureOrbit", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders a tall root with a pinned stage and the title in the middle, and no canvas without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    const { container } = render(<PictureOrbit className="mt-10" />)
    const root = container.querySelector('[data-slot="picture-orbit"]')!
    expect(root).toHaveClass("relative", "mt-10")
    expect(root.querySelector('[data-slot="picture-orbit-stage"]')).toHaveClass("sticky")
    expect(screen.getByText("Land")).toBeInTheDocument()
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("holds the consumer's content in the middle instead", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    render(<PictureOrbit>Our collection</PictureOrbit>)
    expect(screen.getByText("Our collection").closest('[data-slot="picture-orbit-content"]')).toBeInTheDocument()
    expect(screen.queryByText("Land")).toBeNull()
  })
})
