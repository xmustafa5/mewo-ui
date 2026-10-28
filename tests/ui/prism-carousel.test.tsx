import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PrismCarousel, computeMetrics, imageHeight, imageOpacity, imageWidth, layoutImages, type PrismCarouselControls } from "@/registry/mewo/ui/prism-carousel"

const items = ["One", "Two", "Three", "Four"].map((title, i) => ({ src: `/img-${i}.jpg`, alt: `Photo ${title}`, title, subtitle: `About ${title}` }))
const DEFAULTS = { aspect: 1.5, size: 0.62, neighborScale: 0.66, gap: 14 }
// The caption block (title, subtitle and controls) measures 84px with the default type.
const CAPTION = 84

// jsdom has no WebGL; a missing context is the same path a browser without one takes.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("computeMetrics", () => {
  it("reproduces the measured rest layout at 915 × 560", () => {
    const m = computeMetrics(915, 560, CAPTION, DEFAULTS)
    expect(m.Wa).toBeCloseTo(435, 0)
    expect(m.Ha).toBeCloseTo(290, 0)
    expect(imageWidth(1, m)).toBeCloseTo(137.8, 1)
    // Neighbours are 0.66 of the active height.
    expect(imageHeight(1, m)).toBeCloseTo(m.Ha * 0.66, 5)
  })

  it("caps the active width on a narrow container", () => {
    const m = computeMetrics(360, 560, CAPTION, DEFAULTS)
    expect(m.Wa).toBeCloseTo(0.84 * 360, 5)
  })

  it("drags one image per w(½) + gap pixels", () => {
    const m = computeMetrics(915, 560, CAPTION, DEFAULTS)
    expect(m.D).toBeCloseTo(imageWidth(0.5, m) + 14, 9)
  })
})

describe("layoutImages", () => {
  it("centres the active image and packs its neighbours outward with the gap", () => {
    const m = computeMetrics(915, 560, CAPTION, DEFAULTS)
    const boxes = layoutImages(0, 8, true, m, 0.2)
    const active = boxes.find((b) => b.o === 0)!
    const right = boxes.find((b) => b.o === 1)!
    const left = boxes.find((b) => b.o === -1)!
    expect(active.x + active.w / 2).toBeCloseTo(457.5, 6)
    expect(active.w).toBeCloseTo(435, 0)
    expect(active.h).toBeCloseTo(290, 0)
    expect(active.bright).toBe(1)
    expect(right.w).toBeCloseTo(137.8, 1)
    expect(right.x).toBeCloseTo(active.x + active.w + 14, 6)
    expect(right.bright).toBeCloseTo(0.8, 6)
    expect(left.x + left.w).toBeCloseTo(active.x - 14, 6)
    // Looping wraps the left neighbour round to the last image.
    expect(left.index).toBe(7)
  })

  it("leaves out images before the first and after the last without loop", () => {
    const m = computeMetrics(915, 560, CAPTION, DEFAULTS)
    const boxes = layoutImages(0, 8, false, m, 0.2)
    expect(boxes.every((b) => b.o >= 0)).toBe(true)
    expect(layoutImages(0, 0, true, m, 0.2)).toEqual([])
  })

  it("fades only the outermost images", () => {
    expect(imageOpacity(2.5)).toBe(1)
    expect(imageOpacity(3.42)).toBe(0)
  })
})

describe("PrismCarousel", () => {
  it("renders the root, caption and controls with the merged className and no canvas when WebGL is unavailable", () => {
    render(<PrismCarousel className="h-64" data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-64")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "prism-carousel")
    expect(root.querySelector("canvas")).toBeNull()
    expect(root.querySelector('[data-slot="prism-carousel-caption"]')).not.toBeNull()
    expect(root.querySelector('[data-slot="prism-carousel-controls"]')).not.toBeNull()
    expect(screen.getByText("01 / 08")).toBeInTheDocument()
    expect(screen.getByText("Harbour Light")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: /Prism carousel/ })).toBe(root)
  })

  it("moves with the controls, updating the counter, the caption and onIndexChange", async () => {
    const onIndexChange = vi.fn()
    render(<PrismCarousel items={items} autoplay={false} onIndexChange={onIndexChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(await screen.findByText("02 / 04")).toBeInTheDocument()
    expect(screen.getByText("Two")).toBeInTheDocument()
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    // Looping by default: back past the first image to the last.
    expect(await screen.findByText("04 / 04")).toBeInTheDocument()
    expect(onIndexChange).toHaveBeenLastCalledWith(3)
  })

  it("moves with the arrow keys while focused and selects with Enter", async () => {
    const onSelect = vi.fn()
    render(<PrismCarousel items={items} autoplay={false} onSelect={onSelect} data-testid="c" />)
    const root = screen.getByTestId("c")
    fireEvent.keyDown(root, { key: "ArrowRight" })
    expect(await screen.findByText("02 / 04")).toBeInTheDocument()
    fireEvent.keyDown(root, { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith(items[1], 1)
  })

  it("holds at the ends without loop", async () => {
    render(<PrismCarousel items={items} autoplay={false} loop={false} startIndex={3} />)
    expect(screen.getByText("04 / 04")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    expect(await screen.findByText("03 / 04")).toBeInTheDocument()
  })

  it("hands next, previous and goTo to controlsRef", async () => {
    const controls = React.createRef<PrismCarouselControls>()
    render(<PrismCarousel items={items} autoplay={false} controlsRef={controls} />)
    controls.current!.goTo(2)
    expect(await screen.findByText("03 / 04")).toBeInTheDocument()
    controls.current!.previous()
    expect(await screen.findByText("02 / 04")).toBeInTheDocument()
  })

  it("keeps the root ref for the consumer and lets it name the region", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<PrismCarousel ref={ref} items={items} aria-label="Team photos" />)
    expect(ref.current).toBe(screen.getByRole("region", { name: "Team photos" }))
  })

  it("hides the caption and controls when asked", () => {
    const { container } = render(<PrismCarousel items={items} captions={false} controls={false} />)
    expect(container.querySelector('[data-slot="prism-carousel-caption"]')).toBeNull()
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull()
  })

  it("survives prop changes without remounting or throwing", () => {
    const { rerender } = render(<PrismCarousel items={items} data-testid="c" />)
    const root = screen.getByTestId("c")
    rerender(<PrismCarousel items={items.slice(0, 2)} aspect={2} radius={0} backgroundColor="#fff" dpr={1} data-testid="c" />)
    expect(screen.getByTestId("c")).toBe(root)
    expect(screen.getByText("01 / 02")).toBeInTheDocument()
  })
})
