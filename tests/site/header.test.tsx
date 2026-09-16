import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Header } from "@/components/site/header"

describe("Header", () => {
  it("links to docs and GitHub and offers a theme toggle", () => {
    render(<Header />)
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs")
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/xmustafa5/mewo-ui")
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument()
  })
})
