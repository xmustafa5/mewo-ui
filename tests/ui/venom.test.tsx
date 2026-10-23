import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Venom } from "@/registry/mewo/ui/venom"

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("Venom", () => {
  it("renders an empty root with the merged className when WebGL is unavailable", () => {
    render(<Venom text="VENOM" className="h-64" data-testid="v" />)
    const root = screen.getByTestId("v")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "venom")
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("keeps the text in the DOM for screen readers", () => {
    render(<Venom text="VENOM" data-testid="v" />)
    expect(screen.getByText("VENOM")).toHaveClass("sr-only")
  })

  it("keeps an svg child hidden, as the source of the shape", () => {
    render(
      <Venom data-testid="v">
        <svg viewBox="0 0 10 10" data-testid="icon">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </Venom>,
    )
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("hidden")
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<Venom data-testid="v" text="VENOM" />)
    const root = screen.getByTestId("v")
    rerender(
      <Venom data-testid="v" tendrils={0} reach={80} color="#202" paused>
        <svg viewBox="0 0 10 10">
          <rect width="10" height="10" />
        </svg>
      </Venom>,
    )
    expect(screen.getByTestId("v")).toBe(root)
  })
})
