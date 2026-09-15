import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SpotlightCard } from "@/registry/mewo/ui/spotlight-card"

describe("SpotlightCard", () => {
  it("renders children and a hidden spotlight layer", () => {
    render(<SpotlightCard data-testid="c">content</SpotlightCard>)
    expect(screen.getByText("content")).toBeInTheDocument()
    expect(screen.getByTestId("c").querySelector("[aria-hidden]")).not.toBeNull()
  })

  it("forwards className to the root", () => {
    render(<SpotlightCard className="w-64" data-testid="c">x</SpotlightCard>)
    expect(screen.getByTestId("c")).toHaveClass("w-64")
  })

  it("tracks pointer movement without throwing and still calls a user handler", () => {
    const onPointerMove = vi.fn()
    render(<SpotlightCard data-testid="c" onPointerMove={onPointerMove}>x</SpotlightCard>)
    fireEvent.pointerMove(screen.getByTestId("c"), { clientX: 10, clientY: 20 })
    expect(onPointerMove).toHaveBeenCalledTimes(1)
  })
})
