import { describe, expect, it } from "vitest"
import { getNeighbours, getSearchEntries } from "@/lib/navigation"
import { getGroups, getItems } from "@/lib/registry"

describe("getSearchEntries", () => {
  it("lists the docs pages and tools first, then every item once", () => {
    const entries = getSearchEntries()
    expect(entries.slice(0, 4).map((e) => e.href)).toEqual(["/docs", "/docs/components", "/sites", "/studio"])
    expect(entries).toHaveLength(getItems().length + 4)
    expect(new Set(entries.map((e) => e.href)).size).toBe(entries.length)
  })

  it("labels each item with its sidebar group", () => {
    const marquee = getSearchEntries().find((e) => e.href === "/docs/marquee")
    expect(marquee?.section).toBe("Text")
  })
})

describe("getNeighbours", () => {
  const ordered = getGroups().flatMap((group) => group.items)

  it("has no previous for the first item and no next for the last", () => {
    expect(getNeighbours(ordered[0].name).previous).toBeUndefined()
    expect(getNeighbours(ordered[ordered.length - 1].name).next).toBeUndefined()
  })

  it("follows sidebar order across groups", () => {
    const { previous, next } = getNeighbours(ordered[1].name)
    expect(previous?.name).toBe(ordered[0].name)
    expect(next?.name).toBe(ordered[2].name)
  })

  it("returns nothing for an unknown name", () => {
    expect(getNeighbours("nope")).toEqual({})
  })
})
