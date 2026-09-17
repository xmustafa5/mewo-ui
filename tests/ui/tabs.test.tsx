import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "@/registry/mewo/ui/tabs"

function Fixture({ variant }: { variant?: "default" | "line" } = {}) {
  return (
    <Tabs defaultValue="a">
      <TabsList variant={variant} data-testid="list">
        <TabsTrigger value="a">Account</TabsTrigger>
        <TabsTrigger value="b">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("renders triggers and the active panel", () => {
    render(<Fixture />)
    expect(screen.getByRole("tab", { name: "Account" })).toBeInTheDocument()
    expect(screen.getByText("Panel A")).toBeInTheDocument()
  })

  it("renders exactly one indicator, on the active trigger only", () => {
    render(<Fixture />)
    const indicators = document.querySelectorAll("[data-slot='tabs-indicator']")
    expect(indicators).toHaveLength(1)
    expect(screen.getByRole("tab", { name: "Account" })).toContainElement(indicators[0] as HTMLElement)
  })

  it("hides the indicator from assistive technology", () => {
    render(<Fixture />)
    expect(document.querySelector("[data-slot='tabs-indicator']")).toHaveAttribute("aria-hidden", "true")
  })

  it("exposes both list variants", () => {
    expect(tabsListVariants({ variant: "default" })).toContain("bg-muted")
    expect(tabsListVariants({ variant: "line" })).toContain("bg-transparent")
    render(<Fixture variant="line" />)
    expect(screen.getByTestId("list")).toHaveAttribute("data-variant", "line")
  })

  it("merges className on every part", () => {
    render(
      <Tabs defaultValue="a" className="t-root">
        <TabsList className="t-list" data-testid="l">
          <TabsTrigger value="a" className="t-trigger">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="t-content" data-testid="c">X</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("l")).toHaveClass("t-list")
    expect(screen.getByRole("tab", { name: "A" })).toHaveClass("t-trigger")
    expect(screen.getByTestId("c")).toHaveClass("t-content")
  })

  it("supports vertical orientation", () => {
    render(
      <Tabs defaultValue="a" orientation="vertical" data-testid="root">
        <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
        <TabsContent value="a">X</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("root")).toHaveAttribute("data-orientation", "vertical")
  })
})
