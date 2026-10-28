import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ConcaveCarousel,
  edgeMask,
  facesViewer,
  hitWall,
  panelPose,
  projectPoint,
  stepSpring,
  wallGeometry,
  wrapOffset,
  type ConcaveCarouselControls,
} from "@/registry/mewo/ui/concave-carousel"

const items = ["One", "Two", "Three", "Four"].map((title, i) => ({ src: `/img-${i}.jpg`, alt: `Picture ${i + 1}`, title, subtitle: `Caption ${i + 1}` }))
const wall = (overrides: Partial<Parameters<typeof wallGeometry>[0]> = {}) =>
  wallGeometry({ width: 1000, height: 560, count: 8, size: 0.46, aspect: 1.25, curvature: 0.72, gap: 16, distance: 4, captions: true, controls: true, ...overrides })
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// With reduced motion a move lands at once, which also makes it observable here.
const reduceMotion = () => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe("wrapOffset", () => {
  it("keeps the nearest copy of each slot, so the wall loops", () => {
    expect(wrapOffset(0, 8)).toBe(0)
    expect(wrapOffset(3, 8)).toBe(3)
    expect(wrapOffset(5, 8)).toBe(-3)
    expect(wrapOffset(-5, 8)).toBe(3)
    expect(wrapOffset(0.5, 8)).toBe(0.5)
    expect(wrapOffset(4, 8)).toBe(-4)
    expect(wrapOffset(3, 0)).toBe(0)
  })
})

describe("wallGeometry", () => {
  it("keeps the space for the captions and the controls under the wall", () => {
    expect(wall().A).toBe(560 - 64 - 59)
    expect(wall({ captions: false, controls: false }).A).toBe(560)
    expect(wall({ height: 100 }).A).toBe(160)
    expect(wall().h).toBeCloseTo(0.46 * 437)
    expect(wall().w).toBeCloseTo(1.25 * wall().h)
  })

  it("bends the wall with the measured radius and puts the viewer at the measured distance", () => {
    const g = wall()
    expect(g.R).toBeCloseTo((1.16 * g.w) / 0.72)
    expect(g.p).toBeCloseTo(4.17 * g.h)
    expect(wall({ distance: 6 }).p).toBeCloseTo(5.92 * g.h)
    // Neighbours sit `gap` apart along the arc.
    expect(g.alpha * g.R).toBeCloseTo(g.w + 16)
    expect(g.cy).toBe(g.A / 2)
  })

  it("hangs whole copies of the items, enough to fill the view, in eight strips per panel", () => {
    const g = wall()
    expect(g.slots % 8).toBe(0)
    expect(g.slots).toBeGreaterThanOrEqual(8)
    expect(wall({ width: 3000, count: 3 }).slots).toBeGreaterThan(wall({ width: 600, count: 3 }).slots)
    expect(g.strips).toHaveLength(8)
  })
})

describe("facesViewer and panelPose", () => {
  const g = wall()

  it("shows the centre panel and hides one behind the viewer or past the edge of the view", () => {
    expect(facesViewer(0, g.R, g.p, g.W, g.w)).toBe(true)
    expect(facesViewer(Math.PI, g.R, g.p, g.W, g.w)).toBe(false)
    expect(facesViewer(2, g.R, g.p, g.W, g.w)).toBe(false)
    expect(facesViewer(1.5, 400, 300, 1000, 200)).toBe(false)
  })

  it("puts the centre panel flat at the front and mirrors the panels either side", () => {
    expect(panelPose(0, g.alpha, g.R)).toEqual({ theta: 0, x: 0, z: 0 })
    const right = panelPose(1, g.alpha, g.R)
    const left = panelPose(-1, g.alpha, g.R)
    expect(right.theta).toBeCloseTo(g.alpha)
    expect(left.x).toBeCloseTo(-right.x)
    expect(left.z).toBeCloseTo(right.z)
    expect(right.z).toBeGreaterThan(0)
  })
})

describe("projectPoint and hitWall", () => {
  const g = wall()

  it("leaves a point on the screen plane where it is, and lifts the wall when the view tilts down", () => {
    expect(projectPoint(120, -40, 0, g.p, 0)).toEqual([120, -40])
    expect(projectPoint(0, 0, 0, g.p, 10)[1]).toBeLessThan(0)
  })

  it("finds the panel under a screen point", () => {
    expect(hitWall(0, 0, g)).toEqual({ theta: 0, onPanel: true })
    expect(hitWall(0, g.h, g)?.onPanel).toBe(false)
    // The inverse of the projection: the centre of the next panel hits the wall at its angle.
    const { x, z } = panelPose(1, g.alpha, g.R)
    const [sx] = projectPoint(x, 0, z, g.p, 0)
    expect(hitWall(sx, 0, g)?.theta).toBeCloseTo(g.alpha, 6)
  })
})

describe("stepSpring", () => {
  it("settles on its target with about 1% overshoot", () => {
    const s = { pos: 0, vel: 0, target: 1 }
    let peak = 0
    for (let t = 0; t < 2; t += 1 / 60) {
      stepSpring(s, 1 / 60)
      peak = Math.max(peak, s.pos)
    }
    expect(s.pos).toBeCloseTo(1, 4)
    expect(peak).toBeGreaterThan(1)
    expect(peak).toBeLessThan(1.01)
  })

  it("moves the same way whatever the frame rate", () => {
    const a = { pos: 0, vel: 0, target: 1 }
    const b = { pos: 0, vel: 0, target: 1 }
    for (let i = 0; i < 12; i++) stepSpring(a, 1 / 120)
    for (let i = 0; i < 4; i++) stepSpring(b, 1 / 40)
    expect(a.pos).toBeCloseTo(b.pos, 6)
  })
})

describe("edgeMask", () => {
  it("is opaque in the middle and fades to 1 - dim at the edges", () => {
    const mask = edgeMask(0.35)
    expect(mask.startsWith("linear-gradient(to right, rgba(0,0,0,0.650) 0%")).toBe(true)
    expect(mask).toContain("rgba(0,0,0,1.000) 50%")
    expect(mask.endsWith("rgba(0,0,0,0.650) 100%)")).toBe(true)
    expect(edgeMask(0)).not.toMatch(/0\.\d{3}\)/)
  })
})

describe("ConcaveCarousel", () => {
  const matchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMedia
    vi.restoreAllMocks()
  })

  it("renders the root with data-slot, the merged className and the default images", () => {
    render(<ConcaveCarousel className="h-80" data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "h-80")
    // cn() merges Tailwind classes: the consumer's height wins over the default h-full.
    expect(root).not.toHaveClass("h-full")
    expect(root).toHaveAttribute("data-slot", "concave-carousel")
    expect(root).toBe(screen.getByRole("region", { name: /Curved gallery/ }))
    expect(root).toHaveAttribute("aria-roledescription", "carousel")
    expect(root.querySelectorAll('[data-slot="concave-carousel-panel"]').length % 8).toBe(0)
    expect(screen.getByText("/ 08")).toBeInTheDocument()
    expect(screen.getByText("Harbour Light", { selector: "div" })).toBeInTheDocument()
  })

  it("keeps the root ref, the aria-label, the style and the background for the consumer", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<ConcaveCarousel ref={ref} items={items} aria-label="Team photos" backgroundColor="rgb(10, 10, 10)" style={{ height: 300 }} data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(ref.current).toBe(root)
    expect(screen.getByRole("region", { name: "Team photos" })).toBe(root)
    expect(root.style.background).toBe("rgb(10, 10, 10)")
    expect(root.style.height).toBe("300px")
  })

  it("turns with controlsRef: next, previous and goTo the short way round", () => {
    reduceMotion()
    const controls = React.createRef<ConcaveCarouselControls>()
    const onIndexChange = vi.fn()
    render(<ConcaveCarousel items={items} startIndex={1} controlsRef={controls} onIndexChange={onIndexChange} />)
    expect(screen.getByText("02")).toBeInTheDocument()

    act(() => controls.current!.next())
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    act(() => controls.current!.previous())
    act(() => controls.current!.previous())
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
    act(() => controls.current!.previous())
    expect(onIndexChange).toHaveBeenLastCalledWith(3)
    expect(screen.getByText("04")).toBeInTheDocument()

    act(() => controls.current!.goTo(1))
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    expect(screen.getByText("Two, 2 of 4. Caption 2. Picture 2")).toBeInTheDocument()
  })

  it("turns with the buttons and the arrow keys, and selects with Enter", () => {
    reduceMotion()
    const onIndexChange = vi.fn()
    const onSelect = vi.fn()
    render(<ConcaveCarousel items={items} onIndexChange={onIndexChange} onSelect={onSelect} data-testid="c" />)
    const root = screen.getByTestId("c")

    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    fireEvent.click(screen.getByRole("button", { name: "Previous" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(0)

    fireEvent.keyDown(root, { key: "ArrowRight" })
    fireEvent.keyDown(root, { key: "ArrowDown" })
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(root, { key: "ArrowUp" })
    fireEvent.keyDown(root, { key: "ArrowLeft" })
    fireEvent.keyDown(root, { key: "ArrowLeft" })
    expect(onIndexChange).toHaveBeenLastCalledWith(3)

    fireEvent.keyDown(root, { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith(items[3], 3)
  })

  it("pauses and resumes with Space, and follows the paused prop", () => {
    const { rerender } = render(<ConcaveCarousel items={items} data-testid="c" />)
    const live = () => screen.getByText(/of 4/)
    expect(live()).toHaveAttribute("aria-live", "off")
    fireEvent.keyDown(screen.getByTestId("c"), { key: " " })
    expect(live()).toHaveAttribute("aria-live", "polite")
    fireEvent.keyDown(screen.getByTestId("c"), { key: " " })
    expect(live()).toHaveAttribute("aria-live", "off")
    rerender(<ConcaveCarousel items={items} paused data-testid="c" />)
    expect(live()).toHaveAttribute("aria-live", "polite")
  })

  it("lets the consumer's onKeyDown run first and take the key", () => {
    reduceMotion()
    const onIndexChange = vi.fn()
    render(<ConcaveCarousel items={items} onIndexChange={onIndexChange} onKeyDown={(event) => event.preventDefault()} data-testid="c" />)
    fireEvent.keyDown(screen.getByTestId("c"), { key: "ArrowRight" })
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it("hides the controls and the captions when asked", () => {
    render(<ConcaveCarousel items={items} controls={false} captions={false} />)
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull()
    expect(screen.queryByText("One", { selector: "div" })).toBeNull()
  })

  it("stops its frame loop once nothing moves", async () => {
    const raf = vi.spyOn(window, "requestAnimationFrame")
    render(<ConcaveCarousel items={items} autoplay="off" />)
    await wait(80)
    const settled = raf.mock.calls.length
    expect(settled).toBeGreaterThan(0)
    await wait(80)
    expect(raf.mock.calls.length).toBe(settled)
  })

  it("stops off screen and carries on when it is back", async () => {
    let report: IntersectionObserverCallback = () => {}
    const Observer = window.IntersectionObserver
    window.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof IntersectionObserver
    const seen = (isIntersecting: boolean) => act(() => report([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))

    try {
      const raf = vi.spyOn(window, "requestAnimationFrame")
      render(<ConcaveCarousel items={items} />)
      await wait(50)
      // Drifting, the loop runs every frame.
      expect(raf.mock.calls.length).toBeGreaterThan(1)
      seen(false)
      const away = raf.mock.calls.length
      await wait(80)
      expect(raf.mock.calls.length).toBe(away)
      seen(true)
      await wait(50)
      expect(raf.mock.calls.length).toBeGreaterThan(away)
    } finally {
      window.IntersectionObserver = Observer
    }
  })
})
