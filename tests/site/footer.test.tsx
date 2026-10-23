import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigation = vi.hoisted(() => ({ pathname: "/" }))
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }))
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }))

import { Footer } from "@/components/site/footer"

describe("Footer", () => {
  beforeEach(() => {
    navigation.pathname = "/"
  })

  it("leads with the closing call to action on the home page", () => {
    render(<Footer />)
    expect(screen.getByRole("heading", { name: "Make your interface move." })).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /browse components/i })[0]).toHaveAttribute("href", "/docs/components")
  })

  it("starts straight at the links on every other page", () => {
    navigation.pathname = "/docs/marquee"
    render(<Footer />)
    expect(screen.queryByRole("heading", { name: "Make your interface move." })).toBeNull()
    const nav = screen.getByRole("navigation", { name: "Footer" })
    expect(nav).toHaveTextContent("Docs")
    expect(nav).toHaveTextContent("Backgrounds")
    expect(nav).toHaveTextContent("Project")
    expect(screen.getByRole("link", { name: "Dot Grid" })).toHaveAttribute("href", "/docs/dot-grid")
    expect(screen.getByRole("link", { name: "mewo home" })).toHaveAttribute("href", "/")
  })
})
