import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ZOOM_PICTURE_LENGTH, ZoomPicture, layoutFor, pictureAt } from "@/registry/mewo/ui/zoom-picture"

describe("layoutFor", () => {
  it("picks the motion closest to the box's shape", () => {
    expect(layoutFor(1440, 900)).toBe("desktop")
    expect(layoutFor(990, 560)).toBe("desktop")
    expect(layoutFor(768, 900)).toBe("tablet")
    expect(layoutFor(520, 560)).toBe("tablet")
    expect(layoutFor(375, 812)).toBe("phone")
  })
})

describe("pictureAt", () => {
  const out = [0, 0, 0]

  it("holds the small picture, zooms it in to fill the view, then zooms out and hides it", () => {
    expect(pictureAt("desktop", -1, out)[1]).toBeCloseTo(0.2107)
    expect(pictureAt("desktop", 0.3, out)[1]).toBeCloseTo(0.2107)
    expect(pictureAt("desktop", 3, out)[1]).toBeCloseTo(0.997)
    const [, , shown] = pictureAt("desktop", 3, out)
    expect(shown).toBe(1)
    expect(pictureAt("desktop", ZOOM_PICTURE_LENGTH, out)[2]).toBe(0)
  })

  it("with reduced motion, cuts from the small picture to the full one and away, never in between", () => {
    for (let v = -1; v < ZOOM_PICTURE_LENGTH + 1; v += 0.05) {
      const [, s, o] = pictureAt("desktop", v, out, true) as [number, number, number]
      if (o > 0) expect(s < 0.25 || s > 0.99).toBe(true)
    }
    expect(pictureAt("desktop", 0, out, true)[1]).toBeCloseTo(0.2107)
    expect(pictureAt("desktop", 3, out, true)[1]).toBeGreaterThan(0.99)
    expect(pictureAt("desktop", ZOOM_PICTURE_LENGTH, out, true)[2]).toBe(0)
  })

  it("pans down through the zoomed picture: its centre rises while it fills the view", () => {
    const early = pictureAt("desktop", 1.5, out)[0]
    const late = pictureAt("desktop", 6, out)[0]
    expect(late).toBeLessThan(early)
  })
})

describe("ZoomPicture", () => {
  it("drives itself by default: a tall root holding a pinned stage, the picture and the text over it", () => {
    const { container } = render(
      <ZoomPicture className="mt-10" alt="A vessel">
        <p>Over the picture</p>
      </ZoomPicture>
    )
    const root = container.querySelector('[data-slot="zoom-picture"]')!
    expect(root).toHaveClass("relative", "mt-10")
    expect(root.querySelector('[data-slot="zoom-picture-stage"]')).toHaveClass("sticky")
    expect(screen.getByRole("img", { name: "A vessel" })).toBeInTheDocument()
    expect(screen.getByText("Over the picture").closest('[data-slot="zoom-picture-content"]')).toBeInTheDocument()
  })

  it("with scroll off, is the picture alone with a scrim led by --s, sized by className", () => {
    const { container } = render(<ZoomPicture scroll={false} className="aspect-[5/6]" alt="A siege" />)
    const root = container.querySelector('[data-slot="zoom-picture"]')!
    expect(root).toHaveClass("relative", "aspect-[5/6]")
    expect(root.querySelector('[data-slot="zoom-picture-stage"]')).toBeNull()
    expect(screen.getByRole("img", { name: "A siege" })).toBeInTheDocument()
    expect(root.lastElementChild?.className).toContain("var(--s,0)")
  })
})
