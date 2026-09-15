import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AuroraBackground } from "@/registry/mewo/ui/aurora-background"

describe("AuroraBackground", () => {
  it("renders children over the aurora layer", () => {
    render(<AuroraBackground data-testid="a"><h1>Hello</h1></AuroraBackground>)
    expect(screen.getByRole("heading")).toHaveTextContent("Hello")
    expect(screen.getByTestId("a").querySelector("[aria-hidden]")).not.toBeNull()
  })

  it("applies the radial mask by default and drops it when disabled", () => {
    const { rerender } = render(<AuroraBackground data-testid="a">x</AuroraBackground>)
    const layer = () => screen.getByTestId("a").querySelector("[aria-hidden] > div") as HTMLElement
    expect(layer().className).toContain("mask-image")
    rerender(<AuroraBackground data-testid="a" showRadialMask={false}>x</AuroraBackground>)
    expect(layer().className).not.toContain("mask-image")
  })

  it("forwards className to the root", () => {
    render(<AuroraBackground className="min-h-screen" data-testid="a">x</AuroraBackground>)
    expect(screen.getByTestId("a")).toHaveClass("min-h-screen")
  })
})
