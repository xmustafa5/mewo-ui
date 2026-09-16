import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/marquee" }))

import { Sidebar } from "@/components/site/sidebar"

const groups = [
  { group: "sections", label: "Sections", items: [{ name: "hero-aurora", title: "Hero — Aurora" }] },
  { group: "layout", label: "Layout", items: [{ name: "marquee", title: "Marquee" }] },
]

describe("Sidebar", () => {
  it("renders every group and marks the current item", () => {
    render(<Sidebar groups={groups} />)
    expect(screen.getByText("Sections")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Hero — Aurora" })).toHaveAttribute("href", "/docs/hero-aurora")
    expect(screen.getByRole("link", { name: "Marquee" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "/docs")
  })
})
