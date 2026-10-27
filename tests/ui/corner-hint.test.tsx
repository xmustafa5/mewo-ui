import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CornerHint } from "@/registry/mewo/ui/corner-hint"

describe("CornerHint", () => {
  it("renders a status with data-slot and the merged className", () => {
    render(<CornerHint className="custom" />)
    const hint = screen.getByRole("status")
    expect(hint).toHaveAttribute("data-slot", "corner-hint")
    expect(hint).toHaveClass("custom")
  })

  it("shows a message in place of the hint, even when the hint is off", () => {
    render(<CornerHint show={false} message="A carved vase, 3000 BCE." />)
    const hint = screen.getByRole("status")
    expect(hint).toHaveTextContent("A carved vase, 3000 BCE.")
    expect(hint).toHaveClass("opacity-100")
  })

  it("hides when off with no message", () => {
    render(<CornerHint show={false} />)
    expect(screen.getByRole("status")).toHaveClass("opacity-0")
  })
})
