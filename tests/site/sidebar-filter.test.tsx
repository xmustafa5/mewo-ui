import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/marquee" }))

import { Sidebar } from "@/components/site/sidebar"

const groups = [
  { group: "text", label: "Text", items: [{ name: "text-shimmer", title: "Text Shimmer" }, { name: "split-text", title: "Split Text" }] },
  { group: "primitives", label: "Primitives", items: [{ name: "tabs", title: "Tabs", badge: "Drop-in" }] },
  { group: "layout", label: "Layout", items: [{ name: "marquee", title: "Marquee" }] },
]

describe("Sidebar filtering", () => {
  it("counts every item in the filter placeholder", () => {
    render(<Sidebar groups={groups} />)
    expect(screen.getByRole("searchbox", { name: "Filter components" })).toHaveAttribute("placeholder", "Filter 4 components…")
  })

  it("narrows the list by title and drops groups left empty", () => {
    render(<Sidebar groups={groups} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter components" }), { target: { value: "split" } })
    expect(screen.getByRole("link", { name: "Split Text" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Text Shimmer" })).toBeNull()
    expect(screen.queryByText("Layout")).toBeNull()
  })

  it("says so when nothing matches", () => {
    render(<Sidebar groups={groups} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter components" }), { target: { value: "zzz" } })
    expect(screen.getByText("No components match.")).toBeInTheDocument()
  })

  it("shows one category at a time and can go back to all", () => {
    render(<Sidebar groups={groups} />)
    fireEvent.click(screen.getByRole("button", { name: "Layout" }))
    expect(screen.getByRole("button", { name: "Layout" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("link", { name: "Marquee" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Split Text" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "All categories" }))
    expect(screen.getByRole("link", { name: "Split Text" })).toBeInTheDocument()
  })

  it("keeps the drop-in badge out of the link's name", () => {
    render(<Sidebar groups={groups} />)
    expect(screen.getByRole("link", { name: "Tabs" })).toHaveAttribute("href", "/docs/tabs")
  })

  it("links to the full catalog", () => {
    render(<Sidebar groups={groups} />)
    expect(screen.getByRole("link", { name: "Browse all components" })).toHaveAttribute("href", "/docs/components")
  })
})
