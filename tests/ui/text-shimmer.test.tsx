import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TextShimmer } from "@/registry/mewo/ui/text-shimmer"

describe("TextShimmer", () => {
  it("renders the text in a span", () => {
    render(<TextShimmer>Shine</TextShimmer>)
    expect(screen.getByText("Shine").tagName).toBe("SPAN")
  })

  it("forwards className and other props to the root", () => {
    render(<TextShimmer className="text-xl" data-testid="t">Shine</TextShimmer>)
    expect(screen.getByTestId("t")).toHaveClass("text-xl")
  })

  // The light is generated content, so the string is in the DOM once for find, copy and textContent.
  it("puts the text in the DOM once and draws the light from an aria-hidden copy", () => {
    render(<TextShimmer data-testid="t">Shine</TextShimmer>)
    const root = screen.getByTestId("t")
    expect(root.textContent).toBe("Shine")
    const light = root.querySelector('[data-slot="text-shimmer-light"]') as HTMLElement
    expect(light).toHaveAttribute("aria-hidden", "true")
    expect(light.querySelector("[data-text]")).toHaveAttribute("data-text", "Shine")
  })

  // Only transform is animated, which the compositor runs without repainting the text.
  it("animates the light with the two transform keyframes and nothing else", () => {
    render(<TextShimmer data-testid="t">Shine</TextShimmer>)
    const classes = screen.getByTestId("t").innerHTML
    expect(classes).toContain("animate-[mewo-shimmer_")
    expect(classes).toContain("animate-[mewo-shimmer-text_")
    expect(classes).not.toContain("bg-clip-text")
  })

  it("exposes duration as a CSS variable", () => {
    render(<TextShimmer duration={5} data-testid="t">Shine</TextShimmer>)
    expect(screen.getByTestId("t").getAttribute("style")).toContain("--shimmer-duration: 5s")
  })
})
