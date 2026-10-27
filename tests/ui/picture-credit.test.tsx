import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PictureCredit } from "@/registry/mewo/ui/picture-credit"

describe("PictureCredit", () => {
  it("renders the name, place and line with data-slot and the merged className", () => {
    const { container } = render(<PictureCredit className="custom" title="A vessel" by="c. 3000 BCE" line="A museum." href="https://example.com" />)
    const root = container.querySelector('[data-slot="picture-credit"]')!
    expect(root).toHaveClass("grid", "custom")
    expect(root).toHaveTextContent("A vessel, c. 3000 BCE")
    expect(screen.getByRole("link", { name: "A vessel" })).toHaveAttribute("href", "https://example.com")
  })

  it("leaves the name unlinked without href", () => {
    render(<PictureCredit title="A vessel" />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
