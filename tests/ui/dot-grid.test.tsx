import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DotGrid } from "@/registry/mewo/ui/dot-grid"

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("DotGrid", () => {
  it("renders an empty root with the merged className when WebGL is unavailable", () => {
    render(<DotGrid className="h-64" data-testid="d" />)
    const root = screen.getByTestId("d")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "dot-grid")
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<DotGrid data-testid="d" gap={18} />)
    const root = screen.getByTestId("d")
    rerender(<DotGrid data-testid="d" gap={30} dotSize={8} shape="square" paused />)
    expect(screen.getByTestId("d")).toBe(root)
  })
})
