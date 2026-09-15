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

  it("exposes duration as a CSS variable", () => {
    render(<TextShimmer duration={5} data-testid="t">Shine</TextShimmer>)
    expect(screen.getByTestId("t").getAttribute("style")).toContain("--shimmer-duration: 5s")
  })
})
