import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Grainient } from "@/registry/mewo/ui/grainient"

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("Grainient", () => {
  it("renders an empty root with the merged className when WebGL is unavailable", () => {
    render(<Grainient className="h-64" data-testid="g" />)
    const root = screen.getByTestId("g")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "grainient")
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<Grainient data-testid="g" colors={["#000", "#fff"]} />)
    const root = screen.getByTestId("g")
    rerender(<Grainient data-testid="g" colors={["#111", "#222", "#333"]} type="radial" lightMode />)
    expect(screen.getByTestId("g")).toBe(root)
  })
})
