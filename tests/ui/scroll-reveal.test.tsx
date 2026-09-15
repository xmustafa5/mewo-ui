import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ScrollReveal, revealOffset } from "@/registry/mewo/ui/scroll-reveal"

describe("revealOffset", () => {
  it("starts on the opposite side of the travel direction", () => {
    expect(revealOffset("up", 24)).toEqual({ x: 0, y: 24 })
    expect(revealOffset("down", 24)).toEqual({ x: 0, y: -24 })
    expect(revealOffset("left", 10)).toEqual({ x: 10, y: 0 })
    expect(revealOffset("right", 10)).toEqual({ x: -10, y: 0 })
    expect(revealOffset("none", 10)).toEqual({ x: 0, y: 0 })
  })
})

describe("ScrollReveal", () => {
  it("renders children inside the reveal wrapper", () => {
    render(<ScrollReveal data-testid="r"><p>hi</p></ScrollReveal>)
    expect(screen.getByTestId("r")).toHaveAttribute("data-slot", "scroll-reveal")
    expect(screen.getByText("hi")).toBeInTheDocument()
  })

  it("forwards className", () => {
    render(<ScrollReveal className="mt-8" data-testid="r">x</ScrollReveal>)
    expect(screen.getByTestId("r")).toHaveClass("mt-8")
  })
})
