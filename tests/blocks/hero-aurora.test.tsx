import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { HeroAurora } from "@/registry/mewo/blocks/hero-aurora"

describe("HeroAurora", () => {
  it("renders complete with defaults", () => {
    render(<HeroAurora />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Animated components for React")
    expect(screen.getAllByRole("link")).toHaveLength(2)
  })

  it("renders custom copy and links", () => {
    render(
      <HeroAurora
        title="Ship motion"
        primaryCta={{ label: "Docs", href: "/docs" }}
        secondaryCta={{ label: "Code", href: "https://example.com" }}
      />
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Ship motion")
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs")
    expect(screen.getByRole("link", { name: "Code" })).toHaveAttribute("href", "https://example.com")
  })

  it("forwards className to the section", () => {
    render(<HeroAurora className="pt-0" data-testid="h" />)
    expect(screen.getByTestId("h").tagName).toBe("SECTION")
    expect(screen.getByTestId("h")).toHaveClass("pt-0")
  })
})
