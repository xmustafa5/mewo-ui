import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PatternWaves } from "@/registry/mewo/ui/pattern-waves"

// jsdom has no WebGL. The component must notice before handing the canvas to ogl, which throws without one.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("PatternWaves", () => {
  it("renders an empty root with the merged className when WebGL is unavailable", () => {
    render(<PatternWaves className="h-64" data-testid="pw" />)
    const root = screen.getByTestId("pw")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "pattern-waves")
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<PatternWaves data-testid="pw" spacing={9} />)
    const root = screen.getByTestId("pw")
    rerender(<PatternWaves data-testid="pw" spacing={20} pattern="glyph" characters="abc" paused />)
    expect(screen.getByTestId("pw")).toBe(root)
  })
})
