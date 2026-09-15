import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("test harness", () => {
  it("renders JSX and resolves the @ alias", () => {
    render(<div className={cn("a", "b")}>hello</div>)
    expect(screen.getByText("hello")).toHaveClass("a", "b")
  })
})
