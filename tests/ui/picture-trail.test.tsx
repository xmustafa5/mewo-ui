import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PICTURE_TRAIL_LENGTH, PictureTrail, isOn, layoutFor, trackAt } from "@/registry/mewo/ui/picture-trail"

describe("layoutFor", () => {
  it("is wide from 900px across, else a tablet or a phone by its shape", () => {
    expect(layoutFor(1440, 900)).toBe("desktop")
    expect(layoutFor(768, 900)).toBe("tablet")
    expect(layoutFor(375, 812)).toBe("phone")
  })
})

describe("trackAt", () => {
  const track = { size: [100, 50] as const, keys: [[0, 50, 100, 1, 0], [1, 50, 50, 1, 1], [2, 50, 0, 0.5, 1]] }
  const out = [0, 0, 0, 0]

  it("interpolates between keys and holds past either end", () => {
    expect(trackAt(track, -1, out)).toEqual([50, 100, 1, 0])
    expect(trackAt(track, 0.5, out)).toEqual([50, 75, 1, 0.5])
    expect(trackAt(track, 1.5, out)).toEqual([50, 25, 0.75, 1])
    expect(trackAt(track, 5, out)).toEqual([50, 0, 0.5, 1])
  })

  it("reads a key without an opacity as fully shown", () => {
    expect(trackAt({ size: [1, 1], keys: [[0, 50, 50, 1]] }, 3, out)[3]).toBe(1)
  })
})

describe("isOn", () => {
  it("is on inside a window and off outside", () => {
    const track = { size: [1, 1] as const, keys: [[0, 50, 50, 1]], on: [[1, 2]] as const }
    expect(isOn(track, 0.5)).toBe(false)
    expect(isOn(track, 1.5)).toBe(true)
    expect(isOn(track, 2)).toBe(false)
  })
})

describe("PictureTrail", () => {
  it("renders a tall section with a pinned stage holding every part, with the merged className", () => {
    const { container } = render(<PictureTrail className="mt-10" top="Hero" bottom="Last" holders={["One", "Two"]} />)
    const root = container.querySelector<HTMLElement>('[data-slot="picture-trail"]')!
    expect(root).toHaveClass("relative", "mt-10")
    expect(root.style.getPropertyValue("--mewo-length")).toBe(String(PICTURE_TRAIL_LENGTH + 1))
    expect(root.querySelector('[data-slot="picture-trail-stage"]')).toHaveClass("sticky")
    for (const text of ["Hero", "Last", "One", "Two"]) expect(screen.getByText(text)).toBeInTheDocument()
    expect(root.querySelectorAll("[data-part^=buyer]")).toHaveLength(2)
    expect(screen.getByRole("img", { name: "The siege, c. 1258 CE" })).toBeInTheDocument()
  })
})
