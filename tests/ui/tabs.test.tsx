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
      <Tabs defaultValue="a" className="t-root" data-testid="r">
        <TabsList className="t-list" data-testid="l">
          <TabsTrigger value="a" className="t-trigger">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="t-content" data-testid="c">X</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("r")).toHaveClass("t-root")
    expect(screen.getByTestId("l")).toHaveClass("t-list")
    expect(screen.getByRole("tab", { name: "A" })).toHaveClass("t-trigger")
    expect(screen.getByTestId("c")).toHaveClass("t-content")
  })

  it("scopes the indicator's layout id per Tabs instance so unrelated roots don't share a projection node", () => {
    render(
      <>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">One A</TabsTrigger>
            <TabsTrigger value="b">One B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">One panel A</TabsContent>
          <TabsContent value="b">One panel B</TabsContent>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Two A</TabsTrigger>
            <TabsTrigger value="b">Two B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Two panel A</TabsContent>
          <TabsContent value="b">Two panel B</TabsContent>
        </Tabs>
      </>
    )
    const indicators = document.querySelectorAll("[data-slot='tabs-indicator']")
    expect(indicators).toHaveLength(2)
    const ids = Array.from(indicators, (el) => el.getAttribute("data-layout-id"))
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
    expect(ids[0]).not.toEqual(ids[1])
  })

  it("keeps the children of a consumer-supplied render prop", () => {
    // `render` is Base UI's replacement for Radix's `asChild`, and `<TabsTrigger render={<Link/>}>`
    // is the standard routed-tabs pattern. A consumer's `render` overrides ours, so the label must
    // reach Base UI through the props rather than being captured by our own render callback.
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" render={<a href="#routed" />} nativeButton={false}>
            Routed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
      </Tabs>
    )
    const trigger = document.querySelector("[data-slot='tabs-trigger']") as HTMLElement
    expect(trigger.tagName).toBe("A")
    expect(trigger).toHaveTextContent("Routed")
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
