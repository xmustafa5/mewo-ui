import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ScrollStage, sampleKeys, useInScrollStage, type StageKey } from "@/registry/mewo/ui/scroll-stage"

function Probe() {
  return <p data-testid="probe">{useInScrollStage() ? "in" : "out"}</p>
}

describe("sampleKeys", () => {
  const keys: StageKey[] = [[0, 10, 20, 1, 0], [2, 30, 40, 0.5, 1]]

  it("interpolates linearly between keys", () => {
    expect(sampleKeys(keys, 1, [0, 0, 0, 0])).toEqual([20, 30, 0.75, 0.5])
  })

  it("holds the first and last keys outside the track", () => {
    expect(sampleKeys(keys, -1, [0, 0, 0, 0])).toEqual([10, 20, 1, 0])
    expect(sampleKeys(keys, 5, [0, 0, 0, 0])).toEqual([30, 40, 0.5, 1])
  })

  it("reads a missing opacity as 1", () => {
    expect(sampleKeys([[0, 50, 50, 1]], 0, [0, 0, 0, 0])[3]).toBe(1)
  })
})

describe("ScrollStage", () => {
  it("renders its root with data-slot, the merged className and its children", () => {
    const { container } = render(
      <ScrollStage className="z-10" data-testid="stage">
        <Probe />
      </ScrollStage>
    )
    const root = container.querySelector('[data-slot="scroll-stage"]')
    expect(root).toBeInTheDocument()
    expect(root).toHaveClass("fixed", "z-10")
    expect(screen.getByTestId("probe")).toHaveTextContent("in")
  })

  it("tells blocks outside a stage that they are in normal flow", () => {
    render(<Probe />)
    expect(screen.getByTestId("probe")).toHaveTextContent("out")
  })
})
