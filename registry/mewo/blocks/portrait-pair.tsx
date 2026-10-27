"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PictureCredit } from "@/registry/mewo/ui/picture-credit"
import { PictureFigure } from "@/registry/mewo/ui/picture-figure"
import { RichText } from "@/registry/mewo/ui/rich-text"

export interface PortraitPairPicture {
  src: string
  /** Width ÷ height. */
  ratio: number
  alt?: string
  /** The credit hanging under it (portraits only). */
  credit?: { title: string; by: string; line: string; href?: string }
}

export interface PortraitPairProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The large line shown first, alone in the middle. */
  line?: string
  /** The paragraph shown under the two portraits at the end; *italic* and [linked words] markup. */
  text?: string
  /** Where the paragraph's linked words point. */
  href?: string
  /** The first portrait: it rises to the middle, then moves to the inline start. */
  first?: PortraitPairPicture
  /** The second portrait: it rises at half size inside the first, then grows beside it. */
  second?: PortraitPairPicture
  /** Up to four small pictures that fan out around the portraits and gather back into them (wide screens only). */
  sketches?: PortraitPairPicture[]
  /** Viewport heights of scroll the section plays over once its stage is pinned. */
  length?: number
}

type Key = readonly number[]
type Motion = {
  first: Key[]
  second: Key[]
  sketches: Key[][]
  line: { y: number; on: readonly [number, number] }
  text: { y: number; on: readonly [number, number] }
}

// The motion, in screens of scroll from the moment the stage pins: [t, centre x (% of the stage's width), centre y
// (% of its height), scale, opacity]. The line and the paragraph stay put and fade in for their windows of scroll.
const MOTION: Record<"wide" | "narrow", Motion> = {
  wide: {
    first: [[0, 50, 150, 1, 0], [0.05, 50, 150, 1, 1], [1.15, 50, 150, 1, 1], [1.2, 50, 147, 1, 1], [1.35, 50, 128, 1, 1], [1.5, 50, 111, 1, 1], [1.65, 50, 96.1, 1, 1], [1.8, 50, 83.3, 1, 1], [1.95, 50, 72.7, 1, 1], [2.1, 50, 64, 1, 1], [2.2, 50, 59.3, 1, 1], [2.35, 50, 54.1, 1, 1], [2.5, 50, 51, 1, 1], [2.65, 50, 50, 1, 1], [4.05, 49.9, 50, 1, 1], [4.3, 49, 49.1, 0.994, 1], [4.55, 45.2, 45.4, 0.969, 1], [4.85, 37.5, 38.1, 0.923, 1], [5.1, 34.8, 35.5, 0.904, 1], [6.5, 34.2, 34.9, 0.901, 1], [6.6, 34.2, 34.4, 0.901, 1], [6.7, 34.2, 32.5, 0.901, 1], [6.8, 34.2, 28.6, 0.901, 1], [6.85, 34.2, 25.7, 0.901, 1], [6.95, 34.2, 17.3, 0.901, 1], [7, 34.2, 11.7, 0.901, 1], [7.05, 34.2, 5.1, 0.901, 1], [7.1, 34.2, -2.8, 0.901, 1], [7.25, 34.2, -30.3, 0.901, 1], [7.3, 34.2, -37.7, 0.901, 1], [7.4, 34.2, -49.2, 0.901, 1], [7.5, 34.2, -56.8, 0.901, 1], [7.6, 34.2, -61.5, 0.901, 1], [7.7, 34.2, -63.9, 0.901, 1], [7.8, 34.2, -64.8, 0.901, 1]],
    second: [[0, 49.6, 150.1, 0.5, 0], [0.05, 49.6, 150.1, 0.5, 1], [1.15, 49.6, 150.1, 0.5, 1], [1.2, 49.6, 147.1, 0.5, 1], [1.4, 49.6, 122.1, 0.5, 1], [1.55, 49.6, 105.8, 0.5, 1], [1.7, 49.6, 91.6, 0.5, 1], [1.85, 49.6, 79.5, 0.5, 1], [2, 49.6, 69.5, 0.5, 1], [2.15, 49.6, 61.5, 0.5, 1], [2.3, 49.6, 55.6, 0.5, 1], [2.45, 49.6, 51.8, 0.5, 1], [2.65, 49.6, 50.1, 0.5, 1], [4.05, 49.6, 49.9, 0.5, 1], [4.2, 49.9, 49.7, 0.51, 1], [4.35, 50.8, 48.6, 0.538, 1], [4.45, 52, 47.3, 0.574, 1], [4.55, 53.7, 45.4, 0.622, 1], [4.75, 58.5, 40.1, 0.763, 1], [4.85, 60.3, 38.1, 0.817, 1], [5, 62, 36.2, 0.869, 1], [5.1, 62.7, 35.5, 0.888, 1], [5.3, 63.1, 35.1, 0.901, 1], [6.6, 63.1, 34.9, 0.901, 1], [6.7, 63.1, 34.4, 0.901, 1], [6.8, 63.1, 32.5, 0.901, 1], [6.85, 63.1, 30.8, 0.901, 1], [6.95, 63.1, 25.6, 0.901, 1], [7.05, 63.1, 17.2, 0.901, 1], [7.1, 63.1, 11.5, 0.901, 1], [7.15, 63.1, 4.8, 0.901, 1], [7.2, 63.1, -3.1, 0.901, 1], [7.3, 63.1, -22.1, 0.901, 1], [7.35, 63.1, -30.6, 0.901, 1], [7.4, 63.1, -37.9, 0.901, 1], [7.5, 63.1, -49.4, 0.901, 1], [7.6, 63.1, -56.9, 0.901, 1], [7.7, 63.1, -61.6, 0.901, 1], [7.8, 63.1, -63.9, 0.901, 1], [7.9, 63.1, -64.8, 0.901, 1]],
    sketches: [[[0, 50, 150, 1, 0], [0.05, 50, 150, 1, 1], [1.15, 50, 150, 1, 1], [1.2, 49.1, 146.8, 1, 1], [1.4, 42.1, 119.3, 1, 1], [1.6, 36.1, 96, 1, 1], [1.7, 33.6, 85.8, 1, 1], [1.85, 30.2, 72.4, 1, 1], [2, 27.3, 61.4, 1, 1], [2.15, 25.1, 52.7, 1, 1], [2.3, 23.4, 46.2, 1, 1], [2.45, 22.4, 42, 1, 1], [2.6, 21.9, 40.1, 1, 1], [2.95, 21.8, 40, 1, 1], [3.2, 23.2, 40.4, 1, 1], [3.35, 25.2, 41.2, 1, 1], [3.55, 29.3, 42.7, 1, 1], [3.75, 35, 44.7, 1, 1], [4.1, 48.9, 49.6, 1, 1], [4.15, 48.9, 49.6, 1, 0]], [[0, 50, 150, 1, 0], [0.05, 50, 150, 1, 1], [1.15, 50, 150, 1, 1], [1.2, 49.4, 147.2, 1, 1], [1.35, 45.2, 129.1, 1, 1], [1.55, 40.4, 108, 1, 1], [1.7, 37.2, 94.6, 1, 1], [1.8, 35.4, 86.7, 1, 1], [1.95, 33.1, 76.4, 1, 1], [2.1, 31.2, 68.2, 1, 1], [2.25, 29.7, 62, 1, 1], [2.4, 28.8, 57.8, 1, 1], [2.55, 28.2, 55.4, 1, 1], [2.65, 28.1, 55, 1, 1], [3.05, 28.3, 55, 1, 1], [3.35, 30.7, 54.4, 1, 1], [3.7, 37.1, 53, 1, 1], [4.1, 49.1, 50.1, 1, 1], [4.15, 49.1, 50.1, 1, 0]], [[0, 50, 150, 1, 0], [0.05, 50, 150, 1, 1], [1.15, 50, 150, 1, 1], [1.2, 50.6, 146.8, 1, 1], [1.4, 56.1, 119.3, 1, 1], [1.6, 60.8, 96, 1, 1], [1.7, 62.8, 85.8, 1, 1], [1.85, 65.4, 72.4, 1, 1], [2, 67.6, 61.4, 1, 1], [2.15, 69.3, 52.7, 1, 1], [2.3, 70.6, 46.2, 1, 1], [2.45, 71.5, 42, 1, 1], [2.6, 71.8, 40.1, 1, 1], [3.1, 71.5, 40.2, 1, 1], [3.4, 68.6, 41.4, 1, 1], [3.75, 61.7, 44.7, 1, 1], [4.1, 50.7, 49.6, 1, 1], [4.15, 50.7, 49.6, 1, 0]], [[0, 50, 150, 1, 0], [0.05, 50, 150, 1, 1], [1.15, 50, 150, 1, 1], [1.2, 50.9, 147.2, 1, 1], [1.35, 56.2, 129.1, 1, 1], [1.55, 62.5, 108, 1, 1], [1.7, 66.4, 94.6, 1, 1], [1.8, 68.8, 86.7, 0.993, 1], [1.95, 71.8, 76.4, 1, 1], [2, 72.6, 73.6, 0.993, 1], [2.1, 74.2, 68.2, 1, 1], [2.2, 75.5, 63.9, 0.993, 1], [2.25, 76.1, 62, 1, 1], [2.4, 77.3, 57.8, 1, 1], [2.55, 78, 55.4, 1, 1], [3, 78.1, 55, 1, 1], [3.35, 74.8, 54.4, 1, 1], [3.55, 70.7, 53.7, 1, 1], [3.65, 68.1, 53.2, 0.993, 1], [3.75, 65, 52.7, 1, 1], [4.1, 51, 50.1, 1, 1], [4.15, 51, 50.1, 1, 0]]],
    line: { y: 50.1, on: [0.07, 1.48] },
    text: { y: 80.1, on: [4.77, 6.63] },
  },
  narrow: {
    first: [[0, 50.1, 150, 1, 0], [0.05, 50.1, 150, 1, 1], [1.16, 50.1, 150, 1, 1], [1.21, 50.1, 147.8, 1, 1], [1.41, 50.1, 122.5, 1, 1], [1.56, 50.1, 106, 1, 1], [1.72, 50.1, 91.8, 1, 1], [1.82, 50.1, 83.4, 1, 1], [2.02, 50.1, 69.3, 1, 1], [2.17, 50.1, 61.3, 1, 1], [2.32, 50.1, 55.5, 1, 1], [2.47, 50.1, 51.7, 1, 1], [2.68, 50.1, 50, 1, 1], [4.19, 49.5, 49.7, 0.994, 1], [4.29, 48.4, 49.1, 0.994, 1], [4.44, 44.9, 47.7, 0.983, 1], [4.54, 41.2, 45.9, 0.972, 1], [4.85, 24.8, 38.5, 0.92, 1], [4.95, 21.3, 37, 0.909, 1], [5.15, 17.9, 35.3, 0.898, 1], [6.46, 17.3, 35, 0.898, 1], [6.61, 17.3, 34.4, 0.898, 1], [6.71, 17.3, 32.6, 0.898, 1], [6.82, 17.3, 28.6, 0.898, 1], [6.87, 17.3, 25.7, 0.898, 1], [6.97, 17.3, 17.2, 0.898, 1], [7.02, 17.3, 11.5, 0.898, 1], [7.12, 17.3, -3.1, 0.898, 1], [7.27, 17.3, -30.9, 0.898, 1], [7.37, 17.3, -44.5, 0.898, 1], [7.42, 17.3, -49.7, 0.898, 1], [7.47, 17.3, -53.9, 0.898, 1], [7.57, 17.3, -59.9, 0.898, 1], [7.67, 17.3, -63.2, 0.898, 1], [7.83, 17.3, -65, 0.898, 1]],
    second: [[0, 49.1, 150, 0.497, 0], [0.05, 49.1, 150, 0.497, 1], [1.16, 49.1, 150, 0.497, 1], [1.21, 49.1, 147.8, 0.497, 1], [1.41, 49.1, 122.5, 0.497, 1], [1.61, 49.1, 101, 0.497, 1], [1.72, 49.1, 91.8, 0.497, 1], [1.87, 49.1, 79.4, 0.497, 1], [2.02, 49.1, 69.3, 0.497, 1], [2.17, 49.1, 61.3, 0.497, 1], [2.32, 49.1, 55.5, 0.497, 1], [2.47, 49.1, 51.7, 0.497, 1], [2.68, 49.1, 50, 0.497, 1], [3.99, 49.1, 50, 0.497, 1], [4.19, 49.6, 49.8, 0.509, 1], [4.29, 50.7, 49.2, 0.521, 1], [4.44, 53.5, 47.6, 0.562, 1], [4.54, 56.7, 45.9, 0.61, 1], [4.8, 68.8, 39.4, 0.781, 1], [5, 74.7, 36.3, 0.864, 1], [5.1, 76.1, 35.5, 0.882, 1], [5.3, 77.3, 35, 0.899, 1], [6.56, 77.3, 35, 0.899, 1], [6.71, 77.3, 34.4, 0.899, 1], [6.82, 77.3, 32.5, 0.899, 1], [6.87, 77.3, 30.9, 0.899, 1], [6.97, 77.3, 25.4, 0.899, 1], [7.02, 77.3, 21.6, 0.899, 1], [7.12, 77.3, 11.3, 0.899, 1], [7.22, 77.3, -3.6, 0.899, 1], [7.32, 77.3, -22.8, 0.899, 1], [7.37, 77.3, -31.3, 0.899, 1], [7.47, 77.3, -44.8, 0.899, 1], [7.52, 77.3, -49.9, 0.899, 1], [7.57, 77.3, -54.1, 0.899, 1], [7.67, 77.3, -60, 0.899, 1], [7.78, 77.3, -63.2, 0.899, 1], [7.93, 77.3, -65, 0.899, 1]],
    sketches: [],
    line: { y: 49.9, on: [0.08, 1.49] },
    text: { y: 74.9, on: [4.77, 6.64] },
  },
}

const END = 7.8

/** A curve's value at t (linear between keys, held at the ends): [x, y, scale, opacity]. */
export function sampleKeys(keys: readonly Key[], t: number): number[] {
  const first = keys[0]!
  const last = keys[keys.length - 1]!
  if (t <= first[0]!) return first.slice(1)
  if (t >= last[0]!) return last.slice(1)
  let i = 1
  while (keys[i]![0]! < t) i++
  const a = keys[i - 1]!
  const b = keys[i]!
  const f = (t - a[0]!) / (b[0]! - a[0]!)
  return a.slice(1).map((v, k) => v + (b[k + 1]! - v) * f)
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

const pic = (n: number, w: number, h: number) => `https://picsum.photos/seed/mewo-portrait-pair-${n}/${w}/${h}`
const credit = (title: string) => ({ title, by: "c. 1230 CE", line: "A library somewhere. Placeholder photograph." })

const PIECE = "absolute top-0 left-0 will-change-transform motion-reduce:static motion-reduce:will-change-auto"
// the line and the paragraph fade by time once the scroll reaches their window, as the story's text does
const FADE = cn(
  "invisible opacity-0 [transition:opacity_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s_linear_0.8s]",
  "data-on:visible data-on:opacity-100 data-on:[transition:opacity_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s]",
  "motion-reduce:visible motion-reduce:opacity-100 motion-reduce:transition-none"
)

/**
 * Two portraits and the small pictures around them, played by scroll on a pinned stage. A large line shows alone.
 * The first portrait rises to the middle with the second at half size inside it, while small pictures fan out around
 * them. The small pictures gather back in and fade, the portraits move apart to sit side by side and a paragraph shows
 * under them. Then they leave upward. Pins to its nearest scroll container, or to the page. With reduced motion it is a
 * still column.
 */
export function PortraitPair({
  line = "A new capital was founded on the river.",
  text = "Scholars there translated old books, and painters illustrated new ones.",
  href,
  first = { src: pic(1, 740, 1024), ratio: 740 / 1024, credit: credit("A library") },
  second = { src: pic(2, 860, 1240), ratio: 860 / 1240, credit: credit("Men treading grapes") },
  sketches = [
    { src: pic(3, 400, 314), ratio: 400 / 314 },
    { src: pic(4, 316, 400), ratio: 316 / 400 },
    { src: pic(5, 312, 400), ratio: 312 / 400 },
    { src: pic(6, 330, 400), ratio: 330 / 400 },
  ],
  length = END,
  className,
  style,
  ...props
}: PortraitPairProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const firstRef = React.useRef<HTMLElement>(null)
  const secondRef = React.useRef<HTMLElement>(null)
  const sketchRefs = React.useRef<(HTMLElement | null)[]>([])
  const lineRef = React.useRef<HTMLParagraphElement>(null)
  const textRef = React.useRef<HTMLParagraphElement>(null)
  const small = sketches.slice(0, 4)

  React.useEffect(() => {
    const stage = stageRef.current
    // the root's ref stays the consumer's, so the section is reached through the stage
    const section = stage?.parentElement
    if (!stage || !section || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const scroller = scrollParent(section)
    const span = Math.max(0.1, length)
    let raf = 0
    let last = NaN

    const place = (el: HTMLElement | null | undefined, [x, y, s, o]: number[]) => {
      if (!el) return
      el.style.translate = `calc(${x!.toFixed(2)}cqw - 50%) calc(${y!.toFixed(2)}cqh - 50%)`
      el.style.scale = s!.toFixed(3)
      el.style.opacity = o!.toFixed(2)
    }
    const fixed = (el: HTMLElement | null, y: number, on: readonly [number, number], t: number) => {
      if (!el) return
      el.style.translate = `calc(50cqw - 50%) calc(${y}cqh - 50%)`
      el.toggleAttribute("data-on", t >= on[0] && t < on[1])
    }
    const update = () => {
      raf = 0
      // inside a scroll container the stage pins to that container, not the window
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = section.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      const t = Math.min(END, ((-top / Math.max(1, viewport)) * END) / span)
      if (t === last) return
      last = t
      const m = MOTION[stage.clientWidth >= 900 ? "wide" : "narrow"]
      stage.dataset.ready = ""
      place(firstRef.current, sampleKeys(m.first, t))
      place(secondRef.current, sampleKeys(m.second, t))
      m.sketches.forEach((keys, i) => place(sketchRefs.current[i], sampleKeys(keys, t)))
      fixed(lineRef.current, m.line.y, m.line.on, t)
      fixed(textRef.current, m.text.y, m.text.on, t)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      last = NaN
      schedule()
    }

    schedule()
    const target = scroller ?? window
    target.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      target.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", onResize)
    }
  }, [length])

  const figure = (p: PortraitPairPicture) => ({
    src: p.src,
    ratio: p.ratio,
    alt: p.alt ?? (p.credit ? `${p.credit.title}, ${p.credit.by}` : ""),
    caption: p.credit && <PictureCredit {...p.credit} className="gap-[calc(var(--story-u)*0.4)] [&>span:last-child]:leading-[1.2]" />,
  })

  return (
    <section
      data-slot="portrait-pair"
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", "relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-auto", className)}
      style={{ "--mewo-length": 1 + Math.max(0, length), ...style } as React.CSSProperties}
      {...props}
    >
      <div
        ref={stageRef}
        className={cn(
          "sticky top-0 h-[var(--mewo-viewport,100vh)] w-full overflow-hidden [container-type:size]",
          // hidden until the first scroll update has placed every piece
          "motion-safe:[&:not([data-ready])>*]:invisible",
          "motion-reduce:static motion-reduce:flex motion-reduce:h-auto motion-reduce:flex-col motion-reduce:items-center motion-reduce:gap-[calc(var(--story-u)*6)] motion-reduce:py-[calc(var(--story-u)*6)] motion-reduce:[container-type:inline-size]"
        )}
      >
        {small.map((p, i) => (
          <PictureFigure
            key={p.src}
            ref={(el) => {
              sketchRefs.current[i] = el
            }}
            {...figure({ ...p, credit: undefined })}
            className={cn(PIECE, "h-[20cqh] @max-[900px]:hidden motion-reduce:hidden")}
          />
        ))}
        <PictureFigure ref={firstRef} {...figure(first)} className={cn(PIECE, "h-[50cqh] @max-[900px]:h-[30cqh]")} />
        <PictureFigure ref={secondRef} {...figure(second)} className={cn(PIECE, "h-[50cqh] scale-50 @max-[900px]:h-[30cqh] motion-reduce:scale-100")} />
        <p
          ref={lineRef}
          className={cn(
            PIECE,
            FADE,
            "w-[56.25cqw] text-center font-heading text-[3.125cqw] leading-[1.12] tracking-[-0.01em] @max-[900px]:w-[80.8cqw] @max-[900px]:text-[length:min(5.33cqw,24px)] motion-reduce:order-first motion-reduce:w-auto"
          )}
        >
          {line}
        </p>
        <RichText
          ref={textRef}
          text={text}
          href={href}
          className={cn(
            PIECE,
            FADE,
            "w-[80cqh] max-w-full text-center font-heading text-[3.35cqh] leading-[1.12] tracking-[-0.01em] @max-[900px]:w-[80cqw] @max-[900px]:text-[length:min(5.33cqw,24px)] motion-reduce:w-auto"
          )}
        />
      </div>
    </section>
  )
}
