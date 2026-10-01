import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { GradientCarousel, carouselPose, extractPalette, wrapOffset } from "@/registry/mewo/ui/gradient-carousel"

const images = ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg"]
const cards = () => Array.from(screen.getByTestId("c").querySelectorAll<HTMLElement>('[data-slot="gradient-carousel-card"]'))

// jsdom has no canvas; a missing context is the same path a browser without one takes.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"]
})

describe("wrapOffset", () => {
  it("keeps the nearest copy of each card, so the row loops", () => {
    expect(wrapOffset(0, 8)).toBe(0)
    expect(wrapOffset(3, 8)).toBe(3)
    expect(wrapOffset(5, 8)).toBe(-3)
    expect(wrapOffset(-5, 8)).toBe(3)
    expect(wrapOffset(0.5, 8)).toBe(0.5)
  })

  // Exactly half a loop away could go either side; it must pick one and stay there.
  it("puts a card half a loop away on the left", () => {
    expect(wrapOffset(4, 8)).toBe(-4)
    expect(wrapOffset(-4, 8)).toBe(-4)
  })

  it("has nowhere to put a card in an empty carousel", () => {
    expect(wrapOffset(3, 0)).toBe(0)
  })
})

describe("carouselPose", () => {
  it("sits the centre card forward, unturned and sharp", () => {
    expect(carouselPose(0, 28, 140, 0.92)).toEqual({ rotate: 0, depth: 140, scale: 0.95, blur: 0 })
  })

  it("turns, shrinks and softens a card as it nears the stage edge", () => {
    const edge = carouselPose(1, 28, 140, 0.92)
    expect(edge.rotate).toBe(28)
    expect(edge.depth).toBe(0)
    expect(edge.scale).toBeCloseTo(0.92)
    expect(edge.blur).toBe(2)
  })

  it("treats both sides alike and stops changing past the edge", () => {
    expect(carouselPose(-0.5, 28, 140, 0.92)).toEqual(carouselPose(0.5, 28, 140, 0.92))
    expect(carouselPose(3, 28, 140, 0.92)).toEqual(carouselPose(1, 28, 140, 0.92))
  })
})

describe("extractPalette", () => {
  const px = (colour: number[], times: number) => Array.from({ length: times }, () => [...colour, 255]).flat()

  it("returns the most common colour, then the most common one that differs from it", () => {
    // The two reds are close enough to count as one colour, which is what outnumbers the blue.
    const pixels = [...px([200, 30, 30], 3), ...px([204, 28, 28], 2), ...px([20, 40, 220], 4)]
    const [first, second] = extractPalette(pixels)
    expect(first[0]).toBeGreaterThan(190)
    expect(first[2]).toBeLessThan(40)
    expect(second).toEqual([20, 40, 220])
  })

  it("uses the one colour twice for a flat image", () => {
    const [first, second] = extractPalette(px([10, 120, 60], 6))
    expect(first).toEqual([10, 120, 60])
    expect(second).toEqual(first)
  })

  it("ignores transparent pixels and falls back to a neutral pair with nothing to read", () => {
    const [first, second] = extractPalette([255, 0, 0, 0, 255, 0, 0, 10])
    expect(first).toEqual([128, 128, 128])
    expect(second).toEqual([96, 96, 96])
  })
})

describe("GradientCarousel", () => {
  const matchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMedia
  })

  it("renders a decorative card for every image inside a labelled carousel region", () => {
    render(<GradientCarousel images={images} data-testid="c" />)
    const root = screen.getByRole("region", { name: "Image carousel" })
    expect(root).toBe(screen.getByTestId("c"))
    expect(root).toHaveAttribute("data-slot", "gradient-carousel")
    expect(root).toHaveAttribute("aria-roledescription", "carousel")
    expect(cards()).toHaveLength(4)
    for (const card of cards()) expect(card).toHaveAttribute("aria-hidden", "true")
  })

  it("lets the consumer name the region", () => {
    render(<GradientCarousel images={images} aria-label="Team photos" />)
    expect(screen.getByRole("region", { name: "Team photos" })).toBeInTheDocument()
  })

  it("is focusable only while keyboard navigation is on", () => {
    const { rerender } = render(<GradientCarousel images={images} data-testid="c" />)
    expect(screen.getByTestId("c")).toHaveAttribute("tabindex", "0")
    rerender(<GradientCarousel images={images} enableKeyboard={false} data-testid="c" />)
    expect(screen.getByTestId("c")).not.toHaveAttribute("tabindex")
  })

  it("does not report the card it opens on", () => {
    const onCardChange = vi.fn()
    render(<GradientCarousel images={images} initialIndex={2} onCardChange={onCardChange} />)
    expect(onCardChange).not.toHaveBeenCalled()
  })

  // With reduced motion a press lands on the next card at once, which also makes it observable here.
  it("moves one card per arrow key press and wraps round the loop", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia
    const onCardChange = vi.fn()
    render(<GradientCarousel images={images} onCardChange={onCardChange} data-testid="c" />)
    const root = screen.getByTestId("c")

    fireEvent.keyDown(root, { key: "ArrowRight" })
    expect(onCardChange).toHaveBeenLastCalledWith(1)
    fireEvent.keyDown(root, { key: "ArrowLeft" })
    fireEvent.keyDown(root, { key: "ArrowLeft" })
    expect(onCardChange).toHaveBeenLastCalledWith(3)
    expect(onCardChange).toHaveBeenCalledTimes(3)
  })

  it("ignores the arrow keys when keyboard navigation is off", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia
    const onCardChange = vi.fn()
    render(<GradientCarousel images={images} enableKeyboard={false} onCardChange={onCardChange} data-testid="c" />)
    fireEvent.keyDown(screen.getByTestId("c"), { key: "ArrowRight" })
    expect(onCardChange).not.toHaveBeenCalled()
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<GradientCarousel ref={ref} images={images} className="h-80" data-testid="c" />)
    expect(screen.getByTestId("c")).toHaveClass("h-80")
    expect(ref.current).toBe(screen.getByTestId("c"))
  })
})
