import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ZoomPanel } from "@/registry/mewo/ui/zoom-panel"

describe("ZoomPanel", () => {
  it("renders with its defaults, data-slot and the merged className", () => {
    const { container } = render(<ZoomPanel className="z-20" />)
    const root = container.querySelector('[data-slot="zoom-panel"]')
    expect(root).toHaveAttribute("data-state", "shown")
    expect(root).toHaveClass("absolute", "z-20")
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("picsum.photos"))
  })

  it("carries its state and caption", () => {
    const { container } = render(<ZoomPanel state="open" caption="A ledger page" />)
    expect(container.querySelector('[data-slot="zoom-panel"]')).toHaveAttribute("data-state", "open")
    expect(container).toHaveTextContent("A ledger page")
  })
})
