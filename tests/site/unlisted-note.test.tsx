import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UnlistedNote } from "@/components/site/unlisted-note"
import { getAllItems, getItems, isUnlisted } from "@/lib/registry"

describe("UnlistedNote", () => {
  it("says the piece is left out of the list but still installs", () => {
    render(<UnlistedNote />)
    const note = screen.getByRole("note")
    expect(note).toHaveTextContent("Not in the components list")
    expect(note).toHaveTextContent("installs like any other item")
  })

  it("merges the caller's className onto the note", () => {
    render(<UnlistedNote className="mt-5" />)
    expect(screen.getByRole("note")).toHaveClass("mt-5")
  })

  it("the catalog leaves out exactly the unlisted items", () => {
    const all = getAllItems()
    const unlisted = all.filter(isUnlisted)
    expect(getItems()).toHaveLength(all.length - unlisted.length)
    for (const item of unlisted) expect(getItems()).not.toContain(item)
  })
})
