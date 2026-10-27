import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ScrollCaptions, captionAt } from "@/registry/mewo/ui/scroll-captions"

const on = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-slot="scroll-captions-caption"]')].findIndex((c) => c.hasAttribute("data-on"))

describe("captionAt", () => {
  it("shows none until the section is half in view, then one caption per step, holding the last", () => {
    expect(captionAt(-0.6, 3, 1)).toBe(-1)
    expect(captionAt(-0.4, 3, 1)).toBe(0)
    expect(captionAt(1.2, 3, 1)).toBe(1)
    expect(captionAt(9, 3, 1)).toBe(2)
    expect(captionAt(0, 0, 1)).toBe(-1)
  })
})

describe("ScrollCaptions", () => {
  it("renders its section with data-slot, the merged className and a runway per caption", () => {
    const { container } = render(<ScrollCaptions className="custom" captions={["a", "b"]} step={1} />)
    const root = container.querySelector<HTMLElement>('[data-slot="scroll-captions"]')!
    expect(root).toHaveClass("relative", "custom")
    expect(root.style.getPropertyValue("--mewo-length")).toBe("3")
  })

  it("brings up the first caption at the top and follows the scroll", async () => {
    const onCaptionChange = vi.fn()
    const { container } = render(<ScrollCaptions captions={["a", "b", "c"]} step={1} onCaptionChange={onCaptionChange} />)
    await waitFor(() => expect(on(container)).toBe(0))
    const section = container.querySelector('[data-slot="scroll-captions"]')!
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({ top: -window.innerHeight * 1.5 } as DOMRect)
    window.dispatchEvent(new Event("scroll"))
    await waitFor(() => expect(on(container)).toBe(1))
    expect(onCaptionChange.mock.calls).toEqual([[0], [1]])
  })
})
