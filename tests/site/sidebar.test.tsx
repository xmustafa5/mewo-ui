import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/marquee", useRouter: () => ({ push: vi.fn() }) }))

import { Sidebar } from "@/components/site/sidebar"

const groups = [
  { group: "sections", label: "Sections", items: [{ name: "names-duel", title: "Names — Duel" }] },
  { group: "layout", label: "Layout", items: [{ name: "marquee", title: "Marquee" }] },
]

describe("Sidebar", () => {
  it("renders every group and marks the current item", () => {
    render(<Sidebar groups={groups} />)
    expect(screen.getByText("Sections")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Names — Duel" })).toHaveAttribute("href", "/docs/names-duel")
    expect(screen.getByRole("link", { name: "Marquee" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "/docs")
  })
})
