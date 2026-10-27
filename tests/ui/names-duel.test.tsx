import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { NamesDuel, sampleCurve } from "@/registry/mewo/blocks/names-duel"

describe("sampleCurve", () => {
  it("holds the ends and interpolates between keys", () => {
    const keys = [[0, 100, 1], [1, 50, 0.5], [2, 0]]
    expect(sampleCurve(keys, -1)).toEqual([100, 1])
    expect(sampleCurve(keys, 0.5)).toEqual([75, 0.75])
    expect(sampleCurve(keys, 1.5)).toEqual([25, 0.75])
    expect(sampleCurve(keys, 9)).toEqual([0, 1])
  })
})

describe("NamesDuel", () => {
  it("renders its section with data-slot, the merged className and a runway for its length", () => {
    const { container } = render(<NamesDuel className="custom" length={2} />)
    const root = container.querySelector<HTMLElement>('[data-slot="names-duel"]')!
    expect(root).toHaveClass("relative", "custom")
    expect(root.style.getPropertyValue("--mewo-length")).toBe("3")
  })

  it("shows both names and at most two pictures", () => {
    const picture = (n: number) => ({ src: `/p${n}.jpg`, ratio: 1, alt: `Picture ${n}` })
    render(<NamesDuel top="North" bottom="South" pictures={[picture(1), picture(2), picture(3)]} />)
    expect(screen.getByText("North")).toBeInTheDocument()
    expect(screen.getByText("South")).toBeInTheDocument()
    expect(screen.getAllByRole("img")).toHaveLength(2)
  })
})
