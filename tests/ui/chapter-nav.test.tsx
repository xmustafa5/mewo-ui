import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ChapterNav } from "@/registry/mewo/ui/chapter-nav"

const chapters = [
  { title: "First", start: 0 },
  { title: "Second", start: 10 },
]

describe("ChapterNav", () => {
  it("renders its root with data-slot and the merged className", () => {
    const { container } = render(<ChapterNav className="custom" />)
    const root = container.querySelector('[data-slot="chapter-nav"]')
    expect(root).toBeInTheDocument()
    expect(root).toHaveClass("contents", "custom")
  })

  it("opens the chapters panel from the dots and reports the chosen chapter's start", () => {
    const onChapter = vi.fn()
    render(<ChapterNav chapters={chapters} onChapter={onChapter} labels={{ chapters: "Story chapters" }} />)
    const dots = screen.getByRole("button", { name: "Story chapters" })
    expect(dots).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(dots)
    expect(dots).toHaveAttribute("aria-expanded", "true")
    fireEvent.click(screen.getByRole("button", { name: /Second/ }))
    expect(onChapter).toHaveBeenCalledWith(10)
    expect(dots).toHaveAttribute("aria-expanded", "false")
  })

  it("follows open when the page controls it, and closes on Escape", () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<ChapterNav chapters={chapters} open={false} onOpenChange={onOpenChange} />)
    const dots = screen.getByRole("button", { name: "Chapters" })
    fireEvent.click(dots)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(dots).toHaveAttribute("aria-expanded", "false")
    rerender(<ChapterNav chapters={chapters} open onOpenChange={onOpenChange} />)
    expect(dots).toHaveAttribute("aria-expanded", "true")
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("stretches the dot of the chapter the reader is in", () => {
    const { container } = render(<ChapterNav chapters={chapters} bounds={[0, 10, 20]} progress={15} />)
    const dots = container.querySelectorAll("button[aria-controls] > span:not(.sr-only)")
    expect(dots[1]).toHaveClass("h-[calc(var(--story-u)*3)]")
    expect(dots[0]).not.toHaveClass("h-[calc(var(--story-u)*3)]")
  })
})
