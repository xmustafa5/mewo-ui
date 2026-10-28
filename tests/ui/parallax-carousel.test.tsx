import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ParallaxCarousel, easeFactor, parallaxShift, scrollRange, toneCurve, type ParallaxCarouselControls } from "@/registry/mewo/ui/parallax-carousel"

const images = ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg"]
const planes = () => Array.from(screen.getByTestId("c").querySelectorAll<HTMLElement>('[data-slot="parallax-carousel-plane"]'))
const progress = () => screen.getByTestId("c").querySelector('[data-slot="parallax-carousel-progress"]')
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

describe("parallaxShift", () => {
  it("leaves the image of the centre plane in place", () => {
    expect(parallaxShift(0, 1000, 0.4, 840)).toBe(0)
  })

  it("slides an image the same way as its plane, by half its width times the intensity half a view out", () => {
    expect(parallaxShift(500, 1000, 0.4, 840)).toBeCloseTo(168)
    expect(parallaxShift(-250, 1000, 0.4, 840)).toBeCloseTo(-84)
  })
})

describe("toneCurve", () => {
  it("keeps every value at gamma 1", () => {
    expect(Array.from(toneCurve(1))).toEqual(Array.from({ length: 256 }, (_, v) => v))
  })

  it("deepens the mid-tones at 2.2 and keeps black and white", () => {
    const lut = toneCurve(2.2)
    expect(lut[0]).toBe(0)
    expect(lut[64]).toBe(12)
    expect(lut[128]).toBe(56)
    expect(lut[255]).toBe(255)
  })
})

describe("scrollRange", () => {
  it("is the content width minus the view width", () => {
    expect(scrollRange(8, 420, 32, 1100)).toBe(2484)
  })

  it("is 0 when everything fits", () => {
    expect(scrollRange(2, 420, 32, 1100)).toBe(0)
    expect(scrollRange(0, 420, 32, 1100)).toBe(0)
  })
})

describe("easeFactor", () => {
  it("covers lerp of the distance per 60 fps frame", () => {
    expect(easeFactor(0.08, 1 / 60)).toBeCloseTo(0.08)
  })

  it("covers the same distance at any frame rate", () => {
    const step = easeFactor(0.08, 1 / 120)
    expect(1 - (1 - step) ** 2).toBeCloseTo(0.08)
  })
})

describe("ParallaxCarousel", () => {
  it("renders the root with data-slot, the merged className and a plane per default image", () => {
    render(<ParallaxCarousel className="h-96" data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(root).toHaveAttribute("data-slot", "parallax-carousel")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-96")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(planes()).toHaveLength(8)
  })

  it("keeps the root ref for the consumer and lets it name the region", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<ParallaxCarousel ref={ref} images={images} aria-label="Team photos" data-testid="c" />)
    expect(ref.current).toBe(screen.getByTestId("c"))
    expect(screen.getByRole("region", { name: "Team photos" })).toBe(ref.current)
  })

  it("shows each image plainly until it is prepared", () => {
    render(<ParallaxCarousel images={images} data-testid="c" />)
    expect(planes()[1]).toHaveAccessibleName("Image 2 of 4")
    const image = planes()[1].firstElementChild as HTMLElement
    expect(image).toHaveClass("inset-0", "bg-cover", "bg-center")
    expect(image.style.backgroundImage).toContain("/b.jpg")
  })

  describe("in a measured view with reduced motion", () => {
    const matchMedia = window.matchMedia
    const OriginalResizeObserver = window.ResizeObserver

    beforeEach(() => {
      vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(1000)
      vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(600)
      // Reduced motion moves straight to the target, so one frame shows where a move lands.
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as unknown as typeof window.matchMedia
      // Like the real one, this observer reports the size once on observing.
      window.ResizeObserver = class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this as unknown as globalThis.ResizeObserver)
        }
        unobserve() {}
        disconnect() {}
      } as unknown as typeof window.ResizeObserver
    })

    afterEach(() => {
      vi.restoreAllMocks()
      window.matchMedia = matchMedia
      window.ResizeObserver = OriginalResizeObserver
    })

    // A 1000px view with 420px planes 452px apart: plane i sits at 500 - 210 + 452i - scroll.
    it("glides to an image through controlsRef, held to the scroll range, and back on reset", async () => {
      const controls = React.createRef<ParallaxCarouselControls>()
      render(<ParallaxCarousel images={images} controlsRef={controls} data-testid="c" />)
      expect(planes()[0].style.transform).toContain("290.00px")

      controls.current!.scrollToIndex(2)
      await nextFrame()
      // The range is content width minus view width, 1776 - 1000, so image 3 stops 128px short of the centre.
      expect(planes()[2].style.transform).toContain("418.00px")

      controls.current!.reset()
      await nextFrame()
      expect(planes()[0].style.transform).toContain("290.00px")
    })

    it("moves one image per arrow key and to the end of the range on End", async () => {
      render(<ParallaxCarousel images={images} data-testid="c" />)
      fireEvent.keyDown(screen.getByTestId("c"), { key: "ArrowRight" })
      await nextFrame()
      expect(planes()[1].style.transform).toContain("290.00px")

      fireEvent.keyDown(screen.getByTestId("c"), { key: "End" })
      await nextFrame()
      expect(planes()[3].style.transform).toContain("870.00px")
    })

    it("shows the progress line only without loop and with something to scroll", () => {
      const { rerender } = render(<ParallaxCarousel images={images} data-testid="c" />)
      expect(progress()).not.toBeNull()
      rerender(<ParallaxCarousel images={images} loop data-testid="c" />)
      expect(progress()).toBeNull()
      rerender(<ParallaxCarousel images={images.slice(0, 2)} data-testid="c" />)
      expect(progress()).toBeNull()
    })

    it("repeats the planes in loop mode so the wrapped strip fills the view", () => {
      render(<ParallaxCarousel images={images.slice(0, 2)} loop data-testid="c" />)
      expect(planes()).toHaveLength(6)
      expect(planes().filter((plane) => plane.getAttribute("aria-hidden") === "true")).toHaveLength(4)
    })
  })
})
