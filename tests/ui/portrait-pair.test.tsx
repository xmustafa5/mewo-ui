import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PortraitPair, sampleKeys } from "@/registry/mewo/blocks/portrait-pair"

describe("sampleKeys", () => {
  it("holds the ends and interpolates every value between keys", () => {
    const keys = [[0, 50, 150, 1, 0], [2, 30, 50, 0.5, 1]]
    expect(sampleKeys(keys, -1)).toEqual([50, 150, 1, 0])
    expect(sampleKeys(keys, 1)).toEqual([40, 100, 0.75, 0.5])
    expect(sampleKeys(keys, 5)).toEqual([30, 50, 0.5, 1])
  })
})

describe("PortraitPair", () => {
  it("renders its section with data-slot, the merged className and a runway for its length", () => {
    const { container } = render(<PortraitPair className="custom" length={4} />)
    const root = container.querySelector<HTMLElement>('[data-slot="portrait-pair"]')!
    expect(root).toHaveClass("relative", "custom")
    expect(root.style.getPropertyValue("--mewo-length")).toBe("5")
  })

  it("shows the line, the paragraph, both portraits and at most four small pictures", () => {
    const small = Array.from({ length: 6 }, (_, i) => ({ src: `/s${i}.jpg`, ratio: 1, alt: `Small ${i}` }))
    render(<PortraitPair line="A line" text="A paragraph" first={{ src: "/a.jpg", ratio: 1, alt: "First" }} second={{ src: "/b.jpg", ratio: 1, alt: "Second" }} sketches={small} />)
    expect(screen.getByText("A line")).toBeInTheDocument()
    expect(screen.getByText("A paragraph")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "First" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Second" })).toBeInTheDocument()
    expect(screen.getAllByRole("img", { name: /Small/ })).toHaveLength(4)
  })
})
