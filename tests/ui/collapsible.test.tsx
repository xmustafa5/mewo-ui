import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/registry/mewo/ui/collapsible"

function Fixture() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent data-testid="content">
        <p>Hidden detail.</p>
      </CollapsibleContent>
    </Collapsible>
  )
}

describe("Collapsible", () => {
  it("starts closed and opens when the trigger is pressed", () => {
    render(<Fixture />)
    const trigger = screen.getByRole("button", { name: "Toggle" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Hidden detail.")).toBeInTheDocument()
  })

  it("clips the panel so the height animation does not spill", () => {
    render(<Fixture />)
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(screen.getByTestId("content")).toHaveClass("overflow-hidden")
  })

  it("merges className on every part", () => {
    render(
      <Collapsible className="c-root" data-testid="root">
        <CollapsibleTrigger className="c-trigger">T</CollapsibleTrigger>
        <CollapsibleContent className="c-content" data-testid="content">X</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.getByTestId("root")).toHaveClass("c-root")
    expect(screen.getByRole("button", { name: "T" })).toHaveClass("c-trigger")
    fireEvent.click(screen.getByRole("button", { name: "T" }))
    expect(screen.getByTestId("content")).toHaveClass("c-content")
  })

  it("marks its parts with data-slot attributes", () => {
    render(<Fixture />)
    expect(document.querySelector("[data-slot='collapsible']")).toBeInTheDocument()
    expect(document.querySelector("[data-slot='collapsible-trigger']")).toBeInTheDocument()
  })
})
