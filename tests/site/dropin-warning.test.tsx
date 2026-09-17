import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DropInWarning } from "@/components/site/dropin-warning"
import { getItem, isDropIn, getItems } from "@/lib/registry"

describe("DropInWarning", () => {
  it("says installing overwrites the shadcn file of the same name", () => {
    render(<DropInWarning name="tabs" />)
    const note = screen.getByRole("note")
    expect(note).toHaveTextContent("overwrites")
    expect(note).toHaveTextContent("components/ui/tabs.tsx")
  })

  it("names the shadcn version the drop-in was verified against", () => {
    render(<DropInWarning name="collapsible" />)
    expect(screen.getByRole("note")).toHaveTextContent("shadcn CLI 4.21.0")
  })

  it("is shown for every drop-in in the catalog and for nothing else", () => {
    const dropIns = getItems().filter(isDropIn).map((i) => i.name)
    expect(dropIns.sort()).toEqual(["collapsible", "tabs"])
    expect(isDropIn(getItem("text-shimmer")!)).toBe(false)
    expect(isDropIn(getItem("hero-aurora")!)).toBe(false)
  })
})
