import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RisingCaptions, captionAt, layoutFor } from "@/registry/mewo/ui/rising-captions"

describe("layoutFor", () => {
  it("is wide from 900px across, else a tablet or a phone by its shape", () => {
    expect(layoutFor(1440, 900)).toBe("desktop")
    expect(layoutFor(768, 900)).toBe("tablet")
    expect(layoutFor(375, 812)).toBe("phone")
  })
})

describe("captionAt", () => {
  const out = [0, 0]

  it("shows the first caption from the start, and only that one", () => {
    expect(captionAt("desktop", 0, 0, 1, out)[1]).toBe(1)
    expect(captionAt("desktop", 1, 0, 1, out)[1]).toBe(0)
  })

  it("fades the next caption in low, raises it steadily and fades it out before the top", () => {
    expect(captionAt("desktop", 1, 0.8, 1, out)[1]).toBe(0)
    const [low, start] = captionAt("desktop", 1, 0.9, 1, out) as [number, number]
    expect(start).toBeGreaterThan(0)
    expect(start).toBeLessThan(1)
    const [mid, shown] = captionAt("desktop", 1, 1.3, 1, out) as [number, number]
    expect(shown).toBe(1)
    expect(mid).toBeLessThan(low)
    expect(captionAt("desktop", 1, 1.7, 1, out)[1]).toBeLessThan(1)
    expect(captionAt("desktop", 1, 1.85, 1, out)[1]).toBe(0)
  })

  it("rises at the same pace through its stretch", () => {
    const a = captionAt("desktop", 0, 0.3, 1, out)[0]!
    const b = captionAt("desktop", 0, 0.4, 1, out)[0]!
    const c = captionAt("desktop", 0, 0.5, 1, out)[0]!
    expect(a - b).toBeCloseTo(b - c, 6)
  })

  it("gives each caption its own step, one after another", () => {
    expect(captionAt("desktop", 1, 0.5, 1, out)[1]).toBe(0)
    expect(captionAt("desktop", 1, 1.4, 1, out)[1]).toBe(1)
    expect(captionAt("desktop", 1, 2.8, 2, out)[1]).toBe(1)
  })

  it("with reduced motion, holds still half way up and shows for its whole stretch", () => {
    const [y0, o0] = captionAt("desktop", 0, 0, 1, out, true) as [number, number]
    const [y1, o1] = captionAt("desktop", 0, 0.6, 1, out, true) as [number, number]
    expect(y0).toBe(y1)
    expect([o0, o1]).toEqual([1, 1])
  })
})

describe("RisingCaptions", () => {
  it("renders a tall section with a pinned stage and every caption, with the merged classNames", () => {
    const { container } = render(<RisingCaptions className="mt-10" captionClassName="text-white" captions={["One", "Two"]} />)
    const root = container.querySelector('[data-slot="rising-captions"]')!
    expect(root).toHaveClass("relative", "mt-10")
    expect(root.querySelector('[data-slot="rising-captions-stage"]')).toHaveClass("sticky")
    expect(screen.getByText("One")).toHaveClass("text-white")
    expect(screen.getByText("Two")).toBeInTheDocument()
  })
})
