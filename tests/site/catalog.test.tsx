import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ALL_GROUPS, filterEntries, sortEntries, type CatalogEntry } from "@/components/site/catalog/catalog-filter"

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }))

import { ComponentCatalog } from "@/components/site/catalog/component-catalog"

const entry = (name: string, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({
  name,
  title: name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" "),
  description: `${name} description`,
  group: "text",
  groupLabel: "Text",
  added: "2026-09-15",
  isNew: false,
  hasPreview: true,
  ...extra,
})

const entries = [
  entry("text-shimmer", { description: "A light sweep across text" }),
  entry("dot-grid", { group: "background", groupLabel: "Backgrounds", added: "2026-10-21", isNew: true }),
  entry("marquee", { group: "layout", groupLabel: "Layout", added: "2026-09-16" }),
]
const none = new Set<string>()

describe("filterEntries", () => {
  it("matches every word of the query against title, description, category and name", () => {
    expect(
      filterEntries(entries, { query: "light text", group: ALL_GROUPS, newOnly: false }, none).map((e) => e.name),
    ).toEqual(["text-shimmer"])
    expect(filterEntries(entries, { query: "backgrounds", group: ALL_GROUPS, newOnly: false }, none)).toHaveLength(1)
    expect(
      filterEntries(entries, { query: "nothing like this", group: ALL_GROUPS, newOnly: false }, none),
    ).toHaveLength(0)
  })

  it("narrows to one category, and to what is new since the last visit", () => {
    expect(filterEntries(entries, { query: "", group: "layout", newOnly: false }, none).map((e) => e.name)).toEqual([
      "marquee",
    ])
    const unseen = new Set(["marquee"])
    expect(filterEntries(entries, { query: "", group: ALL_GROUPS, newOnly: true }, unseen).map((e) => e.name)).toEqual([
      "marquee",
    ])
  })
})

describe("sortEntries", () => {
  it("puts the newest first, then sorts ties by title", () => {
    expect(sortEntries(entries, "newest", none).map((e) => e.name)).toEqual(["dot-grid", "marquee", "text-shimmer"])
  })

  it("puts what the visitor has not seen first, then the latest release, then A to Z", () => {
    expect(sortEntries(entries, "az", none).map((e) => e.name)).toEqual(["dot-grid", "marquee", "text-shimmer"])
    expect(sortEntries(entries, "az", new Set(["text-shimmer"])).map((e) => e.name)).toEqual([
      "text-shimmer",
      "dot-grid",
      "marquee",
    ])
  })
})

describe("ComponentCatalog", () => {
  const groups = [
    { value: "text", label: "Text" },
    { value: "background", label: "Backgrounds" },
    { value: "layout", label: "Layout" },
  ]

  it("renders one card per item, newest first, each linking to its page with its category", () => {
    render(<ComponentCatalog entries={entries} groups={groups} />)
    const links = screen.getAllByRole("link").filter((link) => link.getAttribute("data-slot") === "preview-card")
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/docs/dot-grid",
      "/docs/marquee",
      "/docs/text-shimmer",
    ])
    expect(links[0]).toHaveTextContent("Backgrounds")
    // The latest release is badged.
    expect(links[0]).toHaveTextContent("New")
    expect(links[1]).not.toHaveTextContent("New")
  })

  it("filters by category and search, and says when nothing matches", () => {
    render(<ComponentCatalog entries={entries} groups={groups} />)
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), { target: { value: "layout" } })
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Marquee"])
    fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), { target: { value: "zzz" } })
    expect(screen.getByRole("status")).toHaveTextContent("No results")
    fireEvent.click(screen.getAllByRole("button", { name: /clear filters/i })[0])
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3)
  })

  it("shows a placeholder instead of a poster for an item that has not been filmed", () => {
    render(<ComponentCatalog entries={[entry("tabs", { hasPreview: false })]} groups={groups} />)
    expect(screen.getByText("<Tabs />")).toBeInTheDocument()
    expect(document.querySelector("img")).toBeNull()
  })
})
