"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ZoomPictureProps extends React.ComponentProps<"div"> {
  /** The picture, about 5 : 6 (it is cropped to fill). */
  src?: string
  /** Its description. */
  alt?: string
  /** Drives itself from the scroll of its nearest scroll container or the page: it pins, zooms in from a small
   * picture until it fills the view, pans down through it, then zooms back out and leaves. Set false when a scroll
   * stage moves it instead: it then only darkens with the stage's `--s`, and className gives its size. */
  scroll?: boolean
  /** Shown over the picture once it fills the view (white text reads on its scrim). */
  children?: React.ReactNode
}

export type ZoomPictureLayout = "desktop" | "tablet" | "phone"
/** One keyframe: [scroll position in view heights after the hold, centre y (% of the view's height), scale, opacity]. */
type Key = readonly [number, number, number, number]
type Motion = { view: readonly [number, number]; size: readonly [number, number]; keys: readonly Key[] }

// The motion per screen shape, laid out on a reference view (its width and height in px) with the picture's own size
// on it; the box shows that view scaled to cover it, so the zoomed picture always fills it. The picture stays
// centred across; scale is against its own size.
const MOTION: Record<ZoomPictureLayout, Motion> = {
  desktop: {
    view: [1440, 900],
    size: [1440, 1713],
    keys: [[0, 34.06, 0.2107, 1], [0.1, 34.06, 0.2107, 1], [0.2, 34.89, 0.2219, 1], [0.25, 36.06, 0.2368, 1], [0.3, 38.06, 0.2621, 1], [0.35, 40.89, 0.2985, 1], [0.4, 44.83, 0.3499, 1], [0.45, 50.11, 0.4182, 1], [0.5, 56.83, 0.5053, 1], [0.6, 73.39, 0.7188, 1], [0.65, 79.89, 0.8029, 1], [0.7, 84.94, 0.8684, 1], [0.75, 88.72, 0.9174, 1], [0.8, 90.72, 0.9524, 1], [0.85, 91.83, 0.9762, 1], [0.95, 91.89, 0.997, 1], [5.85, 18.56, 0.997, 1], [5.95, 18, 0.9747, 1], [6, 18.28, 0.9502, 1], [6.05, 19.11, 0.9144, 1], [6.1, 20.61, 0.8639, 1], [6.15, 22.78, 0.7969, 1], [6.2, 25.28, 0.7114, 1], [6.25, 28, 0.6043, 1], [6.3, 29.72, 0.4972, 1], [6.35, 29.11, 0.4116, 1], [6.4, 26, 0.3454, 1], [6.45, 20, 0.2956, 1], [6.5, 10.94, 0.2591, 1], [6.6, -14.17, 0.2211, 1], [6.65, -24.61, 0.2137, 1], [6.7, -32.94, 0.2107, 1], [6.75, -39.22, 0.21, 1], [6.8, -43.78, 0.21, 1], [6.85, -46.78, 0.21, 1], [6.9, -48.67, 0.21, 1], [7, -50, 0.21, 1], [7.05, -50, 0.21, 0]],
  },
  tablet: {
    view: [768, 900],
    size: [768, 912],
    keys: [[0, 34, 0.2687, 1], [0.2, 34.28, 0.2789, 1], [0.3, 35.06, 0.3161, 1], [0.35, 35.89, 0.3505, 1], [0.45, 38.39, 0.4609, 1], [0.5, 40.22, 0.5411, 1], [0.6, 44.78, 0.739, 1], [0.65, 46.5, 0.8179, 1], [0.7, 47.94, 0.8781, 1], [0.8, 49.67, 0.9555, 1], [0.9, 50.44, 0.9914, 1], [0.95, 50.56, 0.9971, 1], [5.8, 49.56, 1, 1], [5.9, 49.56, 0.99, 1], [6, 49.56, 0.9541, 1], [6.05, 49.56, 0.9212, 1], [6.15, 49.22, 0.8121, 1], [6.2, 48.22, 0.7319, 1], [6.25, 46.44, 0.633, 1], [6.3, 43.44, 0.534, 1], [6.35, 39, 0.4551, 1], [6.4, 32.61, 0.3935, 1], [6.45, 24.28, 0.3462, 1], [6.5, 13.44, 0.3132, 1], [6.6, -13.67, 0.2774, 1], [6.65, -24.44, 0.2716, 1], [6.7, -32.89, 0.2687, 1], [6.75, -39.22, 0.2687, 1], [6.8, -43.78, 0.2687, 1], [6.85, -46.78, 0.2687, 1], [6.9, -48.67, 0.2687, 1], [7, -49.89, 0.2687, 1], [7.05, -49.89, 0.2687, 0]],
  },
  phone: {
    view: [375, 812],
    size: [888, 1056],
    keys: [[0, 33.99, 0.209, 1], [0.217, 34.61, 0.2247, 1], [0.318, 36.45, 0.2729, 1], [0.419, 40.33, 0.373, 1], [0.469, 43.35, 0.4477, 1], [0.52, 47.11, 0.5442, 1], [0.57, 51.66, 0.6576, 1], [0.621, 55.36, 0.7552, 1], [0.671, 58.44, 0.8324, 1], [0.722, 60.78, 0.8914, 1], [0.823, 63.24, 0.965, 1], [0.924, 63.92, 0.994, 1], [5.821, 39.72, 0.9988, 1], [5.922, 39.41, 0.9831, 1], [6.023, 39.53, 0.9349, 1], [6.124, 40.52, 0.8336, 1], [6.175, 40.89, 0.7564, 1], [6.225, 40.76, 0.6588, 1], [6.276, 40.02, 0.5455, 1], [6.326, 37.62, 0.449, 1], [6.377, 33.25, 0.373, 1], [6.427, 26.66, 0.3152, 1], [6.478, 17.55, 0.2729, 1], [6.528, 5.54, 0.2439, 1], [6.579, -8.5, 0.2247, 1], [6.629, -20.32, 0.215, 1], [6.68, -29.74, 0.2102, 1], [6.73, -36.95, 0.209, 1], [6.781, -42.24, 0.209, 1], [6.831, -45.81, 0.209, 1], [6.882, -48.15, 0.209, 1], [6.932, -49.38, 0.209, 1], [7.033, -50, 0.209, 1], [7.084, -50, 0.209, 0]],
  },
}
// view heights the small picture holds once the stage pins, before it zooms
const HOLD = 0.4
/** View heights of scroll the whole sequence takes once the stage pins. */
export const ZOOM_PICTURE_LENGTH = HOLD + 7.1

/** The motion for a box: the reference view closest to its shape (wide, about square, or tall). */
export function layoutFor(width: number, height: number): ZoomPictureLayout {
  const aspect = width / Math.max(1, height)
  let best: ZoomPictureLayout = "desktop"
  let gap = Infinity
  for (const name of ["desktop", "tablet", "phone"] as const) {
    const [vw, vh] = MOTION[name].view
    const d = Math.abs(Math.log(aspect / (vw / vh)))
    if (d < gap) {
      gap = d
      best = name
    }
  }
  return best
}

// Reduced motion: no zoom. The small picture holds until the zoom in is half way, then the full picture shows, still
// panning with the scroll as a page does, until the zoom out is half way; then it is gone.
const REST = Object.fromEntries(
  (Object.keys(MOTION) as ZoomPictureLayout[]).map((name) => {
    const keys = MOTION[name].keys
    const full = keys.filter((k) => k[2] >= 0.99)
    const crossing = (from: number, step: number) => {
      for (let i = from; i >= 0 && i < keys.length; i += step) if (keys[i]![2] >= 0.6 !== keys[from]![2] >= 0.6) return keys[i]![0]
      return keys[from]![0]
    }
    return [name, { full: [full[0]![0], full[full.length - 1]![0]], cut: [crossing(0, 1), crossing(keys.length - 1, -1)] }]
  })
) as Record<ZoomPictureLayout, { full: [number, number]; cut: [number, number] }>

/** The picture at `v` view heights after the stage pins: [centre y (% of the view's height), scale, opacity] into
 * out, linearly between keys and held past either end. With `reduced`, it cuts between small and full instead of
 * zooming. */
export function pictureAt(layout: ZoomPictureLayout, v: number, out: number[], reduced = false) {
  const keys = MOTION[layout].keys
  let t = v - HOLD
  if (reduced) {
    const { full, cut } = REST[layout]
    t = t < cut[0] ? -Infinity : t <= cut[1] ? Math.min(full[1], Math.max(full[0], t)) : Infinity
  }
  let a = keys[0]!
  let b = a
  if (t >= keys[keys.length - 1]![0]) a = b = keys[keys.length - 1]!
  else if (t > a[0]) {
    let lo = 0
    let hi = keys.length - 1
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1
      if (keys[m]![0] <= t) lo = m
      else hi = m
    }
    a = keys[lo]!
    b = keys[hi]!
  }
  const f = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0
  out[0] = a[1] + (b[1] - a[1]) * f
  out[1] = a[2] + (b[2] - a[2]) * f
  out[2] = a[3] + (b[3] - a[3]) * f
  return out
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

/**
 * A picture that zooms in as the reader scrolls, from a small picture until it fills the view, pans down through
 * itself, then zooms back out and leaves. A dark scrim deepens as it grows (from a scale of 0.3 to 0.9), so white
 * text laid over it reads. Pins to its nearest scroll container, or to the page. With `scroll={false}`, a scroll
 * stage moves it instead and writes its scale to `--s`.
 */
export function ZoomPicture({
  src = "https://picsum.photos/seed/mewo-zoom-picture-1/1000/1200",
  alt = "",
  scroll = true,
  children,
  className,
  style,
  ...props
}: ZoomPictureProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const pictureRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const stage = stageRef.current
    const picture = pictureRef.current
    // The root's ref stays the consumer's, so the root is reached through the stage.
    const root = stage?.parentElement
    if (!scroll || !stage || !picture || !root) return
    const scroller = scrollParent(root)
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const out = [0, 0, 0]
    let layout: ZoomPictureLayout = "desktop"
    let k = 1
    let oy = 0
    let width = 1
    let raf = 0
    let near = true
    let last = ""

    const measure = () => {
      // Inside a scroll container the stage pins to that container, not the window.
      if (scroller) root.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      width = Math.max(1, stage.clientWidth)
      const height = Math.max(1, stage.clientHeight)
      layout = layoutFor(width, height)
      const { view, size } = MOTION[layout]
      k = Math.max(width / view[0], height / view[1])
      oy = (height - view[1] * k) / 2
      picture.style.width = `${(size[0] * k).toFixed(2)}px`
      picture.style.height = `${(size[1] * k).toFixed(2)}px`
      last = ""
    }
    const update = () => {
      raf = 0
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = root.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      const [cy, s, o] = pictureAt(layout, -top / Math.max(1, viewport), out, reduced) as [number, number, number]
      const { view, size } = MOTION[layout]
      const x = (width - size[0] * k) / 2
      const y = oy + (cy / 100) * view[1] * k - (size[1] * k) / 2
      const key = `${layout}|${x.toFixed(1)}|${y.toFixed(1)}|${s.toFixed(4)}|${o.toFixed(3)}`
      if (key === last) return
      last = key
      // only transform and opacity change per frame; --s leads the scrim and the text over the picture
      picture.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
      picture.style.transform = `scale(${s.toFixed(4)})`
      picture.style.opacity = o.toFixed(3)
      picture.style.visibility = o < 0.002 ? "hidden" : "visible"
      stage.style.setProperty("--s", s.toFixed(4))
    }
    const schedule = () => {
      if (!raf && near) raf = requestAnimationFrame(update)
    }

    measure()
    schedule()
    const resizeObserver = new ResizeObserver(() => {
      measure()
      schedule()
    })
    resizeObserver.observe(stage)
    if (scroller) resizeObserver.observe(scroller)
    // far from view it doesn't measure on every scroll
    const intersection = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting)
        if (near) {
          last = ""
          schedule()
        }
      },
      // against the window, not the scroll box: the box's own clip still counts, and so does the box leaving the page
      { rootMargin: "50% 0px" }
    )
    intersection.observe(root)
    const target = scroller ?? window
    target.addEventListener("scroll", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      target.removeEventListener("scroll", schedule)
    }
  }, [scroll])

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- items cannot use next/image */}
      <img src={src} alt={alt} decoding="async" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,16,12,0.35),rgba(20,16,12,0.6))] opacity-[clamp(0,calc((var(--s,0)-0.3)/0.6),1)]" />
    </>
  )
  const overlay = children != null && (
    <div
      data-slot="zoom-picture-content"
      className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-white opacity-[clamp(0,calc((var(--s,0)-0.85)/0.15),1)]"
    >
      {children}
    </div>
  )

  if (!scroll)
    return (
      <div data-slot="zoom-picture" className={cn("relative", className)} style={style} {...props}>
        {content}
        {overlay}
      </div>
    )

  return (
    <div
      data-slot="zoom-picture"
      className={cn("relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))]", className)}
      style={{ "--mewo-length": ZOOM_PICTURE_LENGTH + 1, ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={stageRef} data-slot="zoom-picture-stage" className="sticky top-0 h-[var(--mewo-viewport,100vh)] w-full overflow-hidden">
        <div ref={pictureRef} data-slot="zoom-picture-picture" className="invisible absolute top-0 left-0 origin-center will-change-transform">
          {content}
        </div>
        {overlay}
      </div>
    </div>
  )
}
