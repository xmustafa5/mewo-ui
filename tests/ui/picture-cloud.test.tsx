import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PictureCloud, petalWeight, sequenceAt, valueAt } from "@/registry/mewo/ui/picture-cloud"

describe("valueAt", () => {
  it("interpolates between keys and holds past either end", () => {
    const keys = [[0, 0], [1, 10], [2, 0]] as const
    expect(valueAt(keys, -1)).toBe(0)
    expect(valueAt(keys, 0.5)).toBe(5)
    expect(valueAt(keys, 1.5)).toBe(5)
    expect(valueAt(keys, 3)).toBe(0)
  })
})

describe("petalWeight", () => {
  it("is full at a petal's centre, the top first, and empty in the gaps", () => {
    expect(petalWeight(-Math.PI / 2, 10, 0.3)).toBeCloseTo(1)
    expect(petalWeight(-Math.PI / 2 + Math.PI / 10, 10, 0.3)).toBeCloseTo(0)
    expect(petalWeight(-Math.PI / 2 + (2 * Math.PI) / 10, 10, 0.3)).toBeCloseTo(1)
  })
})

describe("sequenceAt", () => {
  it("maps progress onto the sequence, and onto its resting shapes for reduced motion", () => {
    expect(sequenceAt(0)).toBeCloseTo(50.4)
    expect(sequenceAt(1)).toBeCloseTo(84)
    const mid = sequenceAt(0.5)
    expect(sequenceAt(0.5, true)).not.toBe(mid)
    expect([51.7, 58.7, 62, 65.5, 72, 78, 84]).toContain(sequenceAt(0.5, true))
  })
})

describe("PictureCloud", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders its root with data-slot and the merged className, and no canvas without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    const { container } = render(<PictureCloud className="h-40" />)
    const root = container.querySelector('[data-slot="picture-cloud"]')!
    expect(root).toHaveClass("relative", "w-full", "h-40")
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("takes a progress and its controls without throwing when WebGL is missing", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    const controls = { current: null as null | { setProgress: (p: number) => void } }
    const { rerender } = render(<PictureCloud controlsRef={controls} progress={0.2} />)
    expect(() => controls.current?.setProgress(0.6)).not.toThrow()
    rerender(<PictureCloud controlsRef={controls} progress={0.8} />)
  })
})
