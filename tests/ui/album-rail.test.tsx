import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import {
  AlbumRail,
  coverColor,
  createTween,
  flingTarget,
  railOffset,
  railTarget,
  retargetTween,
  sampleTween,
  sleevePose,
  tickPose,
} from "@/registry/mewo/ui/album-rail"

const albums = ["One", "Two", "Three", "Four", "Five"].map((title, i) => ({ title, artist: `Artist ${i + 1}`, cover: `/cover-${i + 1}.jpg` }))

// jsdom has no canvas; the play button keeps the accent, as it does for a cover served without CORS.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"]
})

const matchMedia = window.matchMedia
const IntersectionObserverMock = window.IntersectionObserver
afterEach(() => {
  window.matchMedia = matchMedia
  window.IntersectionObserver = IntersectionObserverMock
  vi.useRealTimers()
})

// With reduced motion every move lands at once, which also makes it observable here.
const reduceMotion = () => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

const frames = () => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] })
const spinners = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[class*="mewo-album-rail-spin"]'))

describe("sleevePose", () => {
  it("leaves the front sleeve flat, full size, on top and with its record ready to slide out", () => {
    const pose = sleevePose(0, 3, 22, 6)
    expect(pose.x).toBeCloseTo(0)
    expect(pose.y).toBeCloseTo(0)
    expect(pose.rotateY).toBeCloseTo(0)
    expect(pose.rotateZ).toBeCloseTo(0)
    expect(pose).toMatchObject({ scale: 1, opacity: 1, shade: 0, record: 1, zIndex: 1000 })
    // While playing it slides left to make room for the record.
    expect(pose.shift).toBeCloseTo(-0.29)
  })

  it("spreads the first neighbour wide, turned and tilted, and tucks later ones in tighter", () => {
    const first = sleevePose(1, 3, 22, 6)
    expect(first).toMatchObject({ rotateY: 22, rotateZ: 6, shade: 0.22, record: 0, zIndex: 990 })
    expect(first.x).toBeCloseTo(0.51)
    expect(first.y).toBeCloseTo(0.03)
    expect(first.scale).toBeCloseTo(0.84)
    expect(first.shift).toBeCloseTo(0.25)
    const second = sleevePose(2, 3, 22, 6)
    const third = sleevePose(3, 3, 22, 6)
    expect(second.x - first.x).toBeCloseTo(0.22)
    expect(third.x - second.x).toBeCloseTo(0.22 * 0.88)
    expect(second.scale).toBeCloseTo(0.7032)
    expect(second.rotateZ).toBeCloseTo(9.6)
  })

  it("mirrors the left side", () => {
    const right = sleevePose(1.5, 3, 22, 6)
    const left = sleevePose(-1.5, 3, 22, 6)
    expect(left.x).toBeCloseTo(-right.x)
    expect(left.rotateY).toBeCloseTo(-right.rotateY)
    expect(left.rotateZ).toBeCloseTo(-right.rotateZ)
    expect(left.y).toBeCloseTo(right.y)
    expect(left.shift).toBeCloseTo(-0.25)
  })

  it("fades sleeves out over the half step past the visible span", () => {
    expect(sleevePose(2.5, 3, 22, 6).opacity).toBe(1)
    expect(sleevePose(3, 3, 22, 6).opacity).toBe(0.5)
    expect(sleevePose(3.5, 3, 22, 6).opacity).toBe(0)
  })
})

describe("railOffset and railTarget", () => {
  it("measures the short way round a looping rail", () => {
    expect(railOffset(0, 9, 10, true)).toBe(1)
    expect(railOffset(0, 9, 10, false)).toBe(-9)
    expect(railOffset(5, 0, 10, true)).toBe(-5)
  })

  it("goes the short way round a loop and holds at the ends otherwise", () => {
    expect(railTarget(0, 9, 10, true)).toBe(10)
    expect(railTarget(3, 9, 10, true)).toBe(13)
    expect(railTarget(12, 0, 10, false)).toBe(9)
    expect(railTarget(-2, 0, 10, false)).toBe(0)
  })
})

describe("tickPose", () => {
  it("hides the ticks under the play button and fades them toward the ruler's ends", () => {
    expect(tickPose(8, 0, 153)).toEqual({ x: 0, opacity: 0 })
    expect(tickPose(6, 0, 153)).toEqual({ x: -36, opacity: 0.4 })
    expect(tickPose(0, 0, 153).opacity).toBeCloseTo((9 / 54) * 0.4)
  })

  it("scrolls with the rail's fraction, one tick per album", () => {
    expect(tickPose(6, 0.5, 153).x).toBe(-45)
    expect(tickPose(6, 2.5, 153)).toEqual(tickPose(6, 0.5, 153))
  })
})

describe("flingTarget", () => {
  it("snaps to the nearest album when released still", () => {
    expect(flingTarget(4.4, 0, 18, 10, false)).toBe(4)
  })

  it("coasts on with a fast release, at most three albums, and stays in range without loop", () => {
    expect(flingTarget(4, -1, 18, 10, false)).toBe(7)
    expect(flingTarget(8, -1, 18, 10, false)).toBe(9)
    expect(flingTarget(8, -1, 18, 10, true)).toBe(11)
  })
})

describe("tweens", () => {
  it("ease in and out from rest and land exactly", () => {
    const tw = createTween(0)
    retargetTween(tw, 1, 1000, 0)
    expect(sampleTween(tw, 500)).toBe(true)
    expect(tw.pos).toBeCloseTo(0.5)
    expect(tw.vel).toBeCloseTo(1.5)
    expect(sampleTween(tw, 1000)).toBe(false)
    expect(tw).toMatchObject({ pos: 1, vel: 0, active: false })
  })

  it("carry their speed into a new target without overshooting it", () => {
    const tw = createTween(0)
    retargetTween(tw, 1, 1000, 0)
    sampleTween(tw, 500)
    retargetTween(tw, 2, 1000, 500)
    expect(tw.pos).toBeCloseTo(0.5)
    expect(tw.vel).toBeCloseTo(1.5)
    for (let t = 500; t <= 1500; t += 25) {
      sampleTween(tw, t)
      expect(tw.pos).toBeLessThanOrEqual(2)
    }
    expect(tw.pos).toBe(2)
  })

  it("jump when given no time", () => {
    const tw = createTween(0)
    retargetTween(tw, 3, 0, 0)
    expect(tw).toMatchObject({ pos: 3, active: false })
  })
})

describe("coverColor", () => {
  const px = (colour: number[], times: number) => Array.from({ length: times }, () => [...colour, 255]).flat()

  it("returns the colour of a flat image", () => {
    expect(coverColor(px([200, 40, 40], 4))).toBe("rgb(200, 40, 40)")
  })

  it("leans hard toward saturated pixels", () => {
    expect(coverColor([...px([128, 128, 128], 3), ...px([255, 0, 0], 1)])).toBe("rgb(239, 16, 16)")
  })

  it("has nothing to say about no pixels", () => {
    expect(coverColor([])).toBeNull()
  })
})

describe("AlbumRail", () => {
  it("renders the default albums in a labelled carousel region with the merged className", () => {
    render(<AlbumRail className="py-6" data-testid="r" />)
    const root = screen.getByTestId("r")
    expect(root).toHaveAttribute("data-slot", "album-rail")
    expect(root).toHaveClass("relative", "w-full", "py-6")
    expect(screen.getByRole("region", { name: "Albums" })).toBe(root)
    expect(root).toHaveAttribute("aria-roledescription", "carousel")
    expect(root.querySelectorAll('[data-slot="album-rail-card"]')).toHaveLength(10)
    expect(screen.getByRole("button", { name: "Play Paper Lanterns by Juniper Hale" })).toHaveAttribute("aria-current", "true")
  })

  it("keeps the root ref for the consumer and lets them name the region", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<AlbumRail ref={ref} albums={albums} aria-label="New releases" />)
    expect(ref.current).toBe(screen.getByRole("region", { name: "New releases" }))
  })

  it("does not report the album it opens on", () => {
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} initialIndex={2} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole("slider", { name: "Choose album" })).toHaveAttribute("aria-valuenow", "3")
  })

  it("moves with the buttons and the keys, wrapping round the loop, and reports each change", () => {
    reduceMotion()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} onChange={onChange} data-testid="r" />)
    const root = screen.getByTestId("r")

    fireEvent.click(screen.getByRole("button", { name: "Next album" }))
    expect(onChange).toHaveBeenLastCalledWith(1, albums[1])
    expect(screen.getByRole("slider", { name: "Choose album" })).toHaveAttribute("aria-valuenow", "2")
    expect(screen.getByText("Two")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Previous album" }))
    expect(onChange).toHaveBeenLastCalledWith(0, albums[0])
    fireEvent.keyDown(root, { key: "End" })
    expect(onChange).toHaveBeenLastCalledWith(4, albums[4])
    fireEvent.keyDown(root, { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith(0, albums[0])
    fireEvent.keyDown(root, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenLastCalledWith(4, albums[4])
    fireEvent.keyDown(root, { key: "Home" })
    expect(onChange).toHaveBeenLastCalledWith(0, albums[0])
    expect(onChange).toHaveBeenCalledTimes(6)
  })

  it("holds at the ends without loop", () => {
    reduceMotion()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} loop={false} onChange={onChange} data-testid="r" />)
    fireEvent.keyDown(screen.getByTestId("r"), { key: "ArrowLeft" })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByTestId("r"), { key: "End" })
    fireEvent.click(screen.getByRole("button", { name: "Next album" }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(4, albums[4])
  })

  it("brings a side sleeve to the front when it is clicked, and jumps to a tapped ruler tick", () => {
    reduceMotion()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Two by Artist 2" }))
    expect(onChange).toHaveBeenLastCalledWith(1, albums[1])

    // jsdom puts the ruler's centre at 0, so a tap 36px right of it is two ticks on.
    const ruler = screen.getByRole("slider", { name: "Choose album" })
    fireEvent.pointerDown(ruler, { pointerId: 1, button: 0, clientX: 36 })
    fireEvent.pointerUp(ruler, { pointerId: 1, button: 0, clientX: 36 })
    expect(onChange).toHaveBeenLastCalledWith(3, albums[3])
  })

  it("plays and pauses from the play button and the front sleeve, spins only the front record, and stops on a move", () => {
    reduceMotion()
    const onPlayChange = vi.fn()
    render(<AlbumRail albums={albums} onPlayChange={onPlayChange} data-testid="r" />)
    const root = screen.getByTestId("r")
    expect(spinners(root).filter((el) => !el.className.includes("_paused]"))).toHaveLength(0)

    fireEvent.click(screen.getByRole("button", { name: "Play One" }))
    expect(onPlayChange).toHaveBeenLastCalledWith(true, 0, albums[0])
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true")
    expect(spinners(root).filter((el) => !el.className.includes("_paused]"))).toHaveLength(1)

    fireEvent.click(screen.getByRole("button", { name: "Pause One by Artist 1" }))
    expect(onPlayChange).toHaveBeenLastCalledWith(false, 0, albums[0])

    fireEvent.click(screen.getByRole("button", { name: "Play One by Artist 1" }))
    expect(onPlayChange).toHaveBeenLastCalledWith(true, 0, albums[0])
    fireEvent.click(screen.getByRole("button", { name: "Next album" }))
    expect(onPlayChange).toHaveBeenLastCalledWith(false, 0, albums[0])
    expect(onPlayChange).toHaveBeenCalledTimes(4)
  })

  it("eases to the next album in the frame loop and stops scheduling frames once it lands", () => {
    frames()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} autoplay={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Next album" }))
    expect(onChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(onChange).toHaveBeenLastCalledWith(1, albums[1])
    expect(vi.getTimerCount()).toBe(0)
  })

  it("autoplays, holds off screen and resumes in view", () => {
    let intersect: IntersectionObserverCallback = () => {}
    window.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof IntersectionObserver
    frames()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} autoplay={1000} onChange={onChange} />)
    const report = (isIntersecting: boolean) => act(() => intersect([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))

    act(() => vi.advanceTimersByTime(2000))
    expect(onChange).toHaveBeenLastCalledWith(1, albums[1])

    report(false)
    act(() => vi.advanceTimersByTime(5000))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)

    report(true)
    act(() => vi.advanceTimersByTime(2000))
    expect(onChange).toHaveBeenLastCalledWith(2, albums[2])
  })

  it("never autoplays for reduced motion", () => {
    reduceMotion()
    frames()
    const onChange = vi.fn()
    render(<AlbumRail albums={albums} autoplay={500} onChange={onChange} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("hides the caption and the controls when asked", () => {
    render(<AlbumRail albums={albums} showCaption={false} showControls={false} />)
    expect(screen.queryByRole("slider")).toBeNull()
    expect(screen.queryByRole("button", { name: "Next album" })).toBeNull()
    expect(screen.queryByText("One")).toBeNull()
  })

  it("renders nothing without albums", () => {
    const { container } = render(<AlbumRail albums={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
