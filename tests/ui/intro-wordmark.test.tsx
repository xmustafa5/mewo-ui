import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { IntroWordmark } from "@/registry/mewo/ui/intro-wordmark"

const mark = (container: HTMLElement) => container.querySelector('[data-slot="intro-wordmark"]')!

describe("IntroWordmark", () => {
  it("renders the name with data-slot and the merged className, hidden from screen readers", () => {
    const { container } = render(<IntroWordmark className="custom">Rivers</IntroWordmark>)
    expect(mark(container)).toHaveTextContent("Rivers")
    expect(mark(container)).toHaveClass("custom")
    expect(mark(container)).toHaveAttribute("aria-hidden", "true")
  })

  it("sits mid-screen while loading and moves up at the top stage", () => {
    const { container, rerender } = render(<IntroWordmark stage="center" />)
    expect(mark(container)).toHaveClass("top-[calc(50%-calc(var(--story-u)*2))]", "opacity-100")
    rerender(<IntroWordmark stage="top" />)
    expect(mark(container)).toHaveClass("top-[5cqh]", "opacity-100")
  })

  it("is hidden before the intro, and on wide screens only once scrolled away", () => {
    const { container, rerender } = render(<IntroWordmark stage="hidden" />)
    expect(mark(container)).toHaveClass("opacity-0")
    expect(mark(container)).not.toHaveClass("max-[900px]:opacity-100")
    rerender(<IntroWordmark stage="top" atTop={false} />)
    expect(mark(container)).toHaveClass("opacity-0", "max-[900px]:opacity-100")
  })
})
