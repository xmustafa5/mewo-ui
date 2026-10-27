import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CornerWordmark } from "@/registry/mewo/ui/corner-wordmark"

describe("CornerWordmark", () => {
  it("links home with data-slot, the merged className and its screen reader label", () => {
    render(<CornerWordmark className="custom" homeLabel="to the start">Rivers</CornerWordmark>)
    const link = screen.getByRole("link", { name: /^Rivers\s+–\s+to the start$/ })
    expect(link).toHaveAttribute("data-slot", "corner-wordmark")
    expect(link).toHaveAttribute("href", "#top")
    expect(link).toHaveClass("custom", "opacity-100")
  })

  it("calls onHome in place of following the link", () => {
    const onHome = vi.fn()
    render(<CornerWordmark onHome={onHome} />)
    const link = screen.getByRole("link")
    const click = new MouseEvent("click", { bubbles: true, cancelable: true })
    fireEvent(link, click)
    expect(onHome).toHaveBeenCalledOnce()
    expect(click.defaultPrevented).toBe(true)
  })

  it("fades out when show is false", () => {
    const { container } = render(<CornerWordmark show={false} />)
    expect(container.querySelector('[data-slot="corner-wordmark"]')).toHaveClass("invisible", "opacity-0")
  })
})
