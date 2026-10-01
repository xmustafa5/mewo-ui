import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TileReveal, tileRevealTimeline } from "@/registry/mewo/ui/tile-reveal"

const images = ["/a.jpg", "/b.jpg", "/c.jpg"]
const tiles = () => Array.from(screen.getByTestId("t").querySelectorAll<HTMLElement>('[data-slot="tile-reveal-tile"]'))

describe("tileRevealTimeline", () => {
  it("staggers the fly-in by row and overlaps the zoom onto its tail", () => {
    const { flyEnd, zoomStart, duration } = tileRevealTimeline(4, 0.06, 0.6)
    expect(flyEnd).toBeCloseTo(1.18)
    expect(zoomStart).toBeCloseTo(0.58)
    expect(duration).toBeCloseTo(1.58)
  })

  it("never starts the zoom before the sequence does", () => {
    const { zoomStart, duration } = tileRevealTimeline(1, 0, 5)
    expect(zoomStart).toBe(0)
    expect(duration).toBe(1)
  })
})

describe("TileReveal", () => {
  it("renders one decorative tile per image", () => {
    render(<TileReveal images={images} data-testid="t" />)
    expect(screen.getByTestId("t")).toHaveAttribute("data-slot", "tile-reveal")
    expect(tiles()).toHaveLength(3)
    for (const tile of tiles()) expect(tile).toHaveAttribute("aria-hidden", "true")
  })

  it("shows the headline and keeps the revealed content in its own slot", () => {
    render(
      <TileReveal images={images} headline={<h2>Headline</h2>} data-testid="t">
        <a href="#go">Go</a>
      </TileReveal>
    )
    expect(screen.getByRole("heading")).toHaveTextContent("Headline")
    const content = screen.getByTestId("t").querySelector('[data-slot="tile-reveal-content"]')
    expect(content).not.toBeNull()
    expect(content).toContainElement(screen.getByText("Go"))
  })

  it("leaves the content slot out when there is nothing to reveal", () => {
    render(<TileReveal images={images} headline="Headline" data-testid="t" />)
    expect(screen.getByTestId("t").querySelector('[data-slot="tile-reveal-content"]')).toBeNull()
  })

  it("renders tiles in grayscale unless told otherwise", () => {
    const { rerender } = render(<TileReveal images={images} data-testid="t" />)
    for (const tile of tiles()) expect(tile).toHaveClass("grayscale")
    rerender(<TileReveal images={images} grayscale={false} data-testid="t" />)
    for (const tile of tiles()) expect(tile).not.toHaveClass("grayscale")
  })

  it("sizes the scroll runway to scrollLength viewports beyond the pinned one", () => {
    render(<TileReveal images={images} scrollLength={2} data-testid="t" />)
    expect(screen.getByTestId("t").getAttribute("style")).toContain("--mewo-length: 3")
  })

  it("reports where the sequence starts", () => {
    const onProgress = vi.fn()
    render(<TileReveal images={images} onProgress={onProgress} />)
    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith(0)
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLElement>()
    render(<TileReveal ref={ref} images={images} className="bg-muted" data-testid="t" />)
    expect(screen.getByTestId("t")).toHaveClass("bg-muted")
    expect(ref.current).toBe(screen.getByTestId("t"))
  })
})
