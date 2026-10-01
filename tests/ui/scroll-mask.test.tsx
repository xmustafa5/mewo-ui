import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ScrollMask, maskEdge } from "@/registry/mewo/ui/scroll-mask"

const root = () => screen.getByTestId("m")
const pieces = () => root().querySelectorAll('[data-slot="scroll-mask-piece"]')
const layer = () => root().querySelector('[data-slot="scroll-mask-layer"]')

describe("maskEdge", () => {
  // Starting only one feather out would leave the soft edge showing before any scroll.
  it("starts two feathers out of sight and ends at the far side of the frame", () => {
    expect(maskEdge(0, 14)).toBe(-28)
    expect(maskEdge(0.5, 14)).toBe(36)
    expect(maskEdge(1, 14)).toBe(100)
  })

  it("spans exactly the frame when the edge is hard", () => {
    expect(maskEdge(0, 0)).toBe(0)
    expect(maskEdge(1, 0)).toBe(100)
  })
})

describe("ScrollMask", () => {
  it("reveals a single masked layer by default", () => {
    render(<ScrollMask data-testid="m" />)
    expect(root()).toHaveAttribute("data-slot", "scroll-mask")
    expect(layer()).not.toBeNull()
    expect(pieces()).toHaveLength(0)
  })

  it("names the picture for assistive tech only when given alt text", () => {
    const { rerender } = render(<ScrollMask alt="A valley at dusk" data-testid="m" />)
    expect(screen.getByRole("img", { name: "A valley at dusk" })).toBeInTheDocument()
    rerender(<ScrollMask data-testid="m" />)
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("cuts the picture into one strip per column for slats", () => {
    render(<ScrollMask variant="slats" columns={5} alt="A valley at dusk" data-testid="m" />)
    expect(layer()).toBeNull()
    expect(pieces()).toHaveLength(5)
    // The strips are one picture, so it is named once, on their container.
    expect(screen.getAllByRole("img")).toHaveLength(1)
  })

  it("cuts the picture into a grid of cells", () => {
    render(<ScrollMask variant="grid" columns={4} data-testid="m" />)
    // Until the frame is measured the grid is assumed square.
    expect(pieces()).toHaveLength(16)
  })

  it("layers children over the frame, hidden until the reveal unless told otherwise", () => {
    const { rerender } = render(
      <ScrollMask data-testid="m">
        <h3>Caption</h3>
      </ScrollMask>
    )
    const content = () => root().querySelector('[data-slot="scroll-mask-content"]') as HTMLElement
    expect(content()).toContainElement(screen.getByText("Caption"))
    expect(content()).toHaveClass("opacity-0")
    rerender(
      <ScrollMask revealContent={false} data-testid="m">
        <h3>Caption</h3>
      </ScrollMask>
    )
    expect(content()).not.toHaveClass("opacity-0")
  })

  it("sizes the scroll runway to scrollLength viewports beyond the pinned one", () => {
    render(<ScrollMask scrollLength={2} data-testid="m" />)
    expect(root().getAttribute("style")).toContain("--mewo-length: 3")
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLElement>()
    render(<ScrollMask ref={ref} className="bg-muted" data-testid="m" />)
    expect(root()).toHaveClass("bg-muted")
    expect(ref.current).toBe(root())
  })
})
