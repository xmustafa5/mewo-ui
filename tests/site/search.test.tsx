import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Search, filterEntries, type SearchEntry } from "@/components/site/search"

const entries: SearchEntry[] = [
  { href: "/docs", title: "Introduction", section: "Docs" },
  { href: "/docs/marquee", title: "Marquee", section: "Layout", description: "An infinite, seamless scroll." },
  { href: "/docs/text-shimmer", title: "Text Shimmer", section: "Text", description: "A light sweep across text." },
]

describe("filterEntries", () => {
  it("returns everything for an empty query", () => {
    expect(filterEntries(entries, "  ")).toHaveLength(3)
  })

  it("matches title, section and description, ignoring case", () => {
    expect(filterEntries(entries, "MARQ").map((e) => e.title)).toEqual(["Marquee"])
    expect(filterEntries(entries, "layout").map((e) => e.title)).toEqual(["Marquee"])
    expect(filterEntries(entries, "sweep").map((e) => e.title)).toEqual(["Text Shimmer"])
  })
})

describe("Search", () => {
  it("opens from the trigger and filters as you type", async () => {
    render(<Search entries={entries} />)
    fireEvent.click(screen.getByRole("button", { name: "Search components" }))
    const input = await screen.findByRole("textbox", { name: "Search components and docs" })
    fireEvent.change(input, { target: { value: "shimmer" } })
    expect(screen.getByRole("link", { name: /Text Shimmer/ })).toHaveAttribute("href", "/docs/text-shimmer")
    expect(screen.queryByRole("link", { name: /Marquee/ })).toBeNull()
  })

  it("opens on the / shortcut", async () => {
    render(<Search entries={entries} />)
    fireEvent.keyDown(window, { key: "/" })
    expect(await screen.findByRole("textbox", { name: "Search components and docs" })).toBeInTheDocument()
  })

  it("moves the highlight with the arrow keys", async () => {
    render(<Search entries={entries} />)
    fireEvent.click(screen.getByRole("button", { name: "Search components" }))
    const input = await screen.findByRole("textbox", { name: "Search components and docs" })
    expect(screen.getByRole("link", { name: /Introduction/ })).toHaveAttribute("data-active")
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(screen.getByRole("link", { name: /Marquee/ })).toHaveAttribute("data-active")
    fireEvent.keyDown(input, { key: "ArrowUp" })
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(screen.getByRole("link", { name: /Text Shimmer/ })).toHaveAttribute("data-active")
  })

  it("says when nothing matches", async () => {
    render(<Search entries={entries} />)
    fireEvent.click(screen.getByRole("button", { name: "Search components" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Search components and docs" }), { target: { value: "zzz" } })
    expect(screen.getByText("Nothing matches “zzz”.")).toBeInTheDocument()
  })
})
