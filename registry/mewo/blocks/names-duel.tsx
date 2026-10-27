"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PictureCredit } from "@/registry/mewo/ui/picture-credit"
import { PictureFigure } from "@/registry/mewo/ui/picture-figure"

export interface NamesDuelPicture {
  src: string
  /** Width ÷ height. */
  ratio: number
  alt?: string
  /** The credit hanging under it. */
  credit?: { title: string; by: string; line: string; href?: string }
}

export interface NamesDuelProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The name that rises first, rests at the top, then shrinks away. */
  top?: string
  /** The name that follows it, small, and grows into its place. */
  bottom?: string
  /** One picture, or two side by side as layers, passing between the names. */
  pictures?: NamesDuelPicture[]
  /** Viewport heights of scroll the duel plays over once its stage is pinned. */
  length?: number
}

type Key = readonly number[]
type Motion = {
  top: Key[]
  bottom: Key[]
  one: Key[]
  first: { x: number; y: Key[] }
  second: { x: number; y: Key[] }
}

// The motion, in screens of scroll from the moment the top name starts to rise: [t, centre y (% of the stage's
// height), scale]. Pictures keep their size; two pictures sit at their own x (% of the width), as layers.
const MOTION: Record<"wide" | "narrow", Motion> = {
  wide: {
    top: [[0, 120.4, 1], [0.1, 120.4, 1], [0.2, 101.6, 1], [0.3, 85.4, 1], [0.45, 65.4, 1], [0.6, 49.9, 1], [0.7, 41.9, 1], [0.8, 35.5, 1], [0.9, 30.5, 1], [1.1, 24.1, 1], [1.3, 21.2, 0.998], [1.45, 20.2, 0.986], [1.6, 19.6, 0.943], [1.7, 18.9, 0.889], [1.8, 17.7, 0.807], [1.9, 16.3, 0.695], [2, 14.4, 0.554], [2.05, 13.6, 0.494], [2.1, 12.8, 0.442], [2.2, 11.6, 0.361], [2.3, 10.3, 0.307], [2.45, 7.8, 0.264], [2.6, 4, 0.251], [2.7, 0.2, 0.25], [2.8, -4.8, 0.25], [2.9, -11.2, 0.25], [3.05, -24, 0.25], [3.2, -40.9, 0.25], [3.35, -62.6, 0.25]],
    bottom: [[0, 190.6, 0.25], [0.25, 190.6, 0.25], [0.3, 180.9, 0.25], [0.4, 163.4, 0.25], [0.5, 148.4, 0.25], [0.6, 135.7, 0.25], [0.7, 124.9, 0.25], [0.8, 116, 0.25], [0.9, 108.8, 0.25], [1, 103.1, 0.25], [1.15, 97, 0.25], [1.3, 93.3, 0.251], [1.5, 90.8, 0.274], [1.6, 90.1, 0.307], [1.7, 89.5, 0.36], [1.8, 88.7, 0.442], [1.9, 87.6, 0.554], [2, 86.3, 0.695], [2.05, 85.7, 0.756], [2.15, 84.8, 0.852], [2.25, 84, 0.918], [2.3, 83.6, 0.943], [2.4, 82.8, 0.975], [2.5, 81.6, 0.992], [2.65, 78.4, 0.999], [2.8, 73.2, 1], [2.9, 68.2, 1], [3, 61.7, 1], [3.1, 53.7, 1], [3.2, 43.9, 1], [3.3, 32.2, 1], [3.4, 18.3, 1], [3.5, 2.1, 1], [3.6, -16.6, 1], [4, -16.6, 1]],
    one: [[0, 147.3], [0.05, 147.3], [0.2, 122.1], [0.3, 108.2], [0.4, 96.4], [0.55, 82.4], [0.65, 75.2], [0.75, 69.5], [0.9, 63.4], [1.05, 59.7], [1.2, 57.8], [1.55, 56.3], [1.75, 54.3], [2.05, 47.5], [2.65, 38.3], [2.85, 32.5], [3, 25.8], [3.15, 16.9], [3.25, 9.5], [3.35, 0.8], [3.45, -9.3], [3.55, -20.8], [3.7, -41.3], [3.8, -56.9], [4, -56.9]],
    first: { x: 57.7, y: [[0, 151.4], [0.05, 151.4], [0.15, 133.9], [0.25, 118.9], [0.35, 106.1], [0.45, 95.3], [0.6, 82.6], [0.75, 73.5], [0.9, 67.4], [1.05, 63.7], [1.2, 61.8], [1.5, 60.6], [1.75, 58.3], [2.15, 49.7], [2.6, 43.4], [2.85, 36.5], [3, 29.8], [3.15, 20.9], [3.25, 13.5], [3.35, 4.8], [3.5, -10.8], [3.6, -23.2], [3.7, -37.2], [3.8, -52.9], [4, -52.9]] },
    second: { x: 38.6, y: [[0, 140.5], [0.05, 140.5], [0.15, 123.2], [0.25, 108.1], [0.35, 95.3], [0.45, 84.5], [0.6, 71.8], [0.7, 65.4], [0.8, 60.4], [0.9, 56.6], [1.05, 52.9], [1.2, 51.1], [1.55, 49.5], [1.75, 47.5], [2.05, 40.7], [2.65, 31.5], [2.85, 25.7], [3.05, 16.4], [3.15, 10.2], [3.25, 2.7], [3.35, -5.9], [3.45, -16.1], [3.55, -27.6], [3.65, -40.8], [3.8, -63.7]] },
  },
  narrow: {
    top: [[0, 115, 1], [0.1, 115, 1], [0.15, 107.9, 1], [0.25, 89.9, 1], [0.3, 81.9, 1], [0.45, 61.3, 1], [0.61, 45.4, 1], [0.71, 37.2, 1], [0.81, 30.5, 1], [0.96, 23.4, 1], [1.16, 17.7, 1], [1.31, 15.8, 1], [1.46, 15.1, 0.991], [1.56, 14.9, 0.974], [1.67, 14.8, 0.942], [1.82, 14.4, 0.858], [1.92, 14.1, 0.774], [2.07, 13.5, 0.626], [2.22, 12.9, 0.527], [2.37, 11.5, 0.475], [2.58, 7.6, 0.452], [2.68, 4.3, 0.449], [2.78, -0.3, 0.449], [2.88, -6.2, 0.449], [3.03, -18.2, 0.449], [3.13, -28.4, 0.449], [3.23, -40.6, 0.449], [3.38, -63.1, 0.449]],
    bottom: [[0, 191.7, 0.45], [0.25, 191.7, 0.45], [0.3, 184.3, 0.45], [0.35, 174.9, 0.45], [0.45, 158.3, 0.45], [0.61, 137.8, 0.45], [0.76, 122, 0.45], [0.86, 113.7, 0.45], [1.01, 104.4, 0.45], [1.11, 99.9, 0.45], [1.26, 95.4, 0.45], [1.46, 92.5, 0.459], [1.62, 91.8, 0.491], [1.72, 91.5, 0.531], [1.77, 91.3, 0.56], [1.92, 91, 0.676], [2.07, 90.6, 0.827], [2.17, 90.4, 0.896], [2.27, 90.2, 0.943], [2.37, 89.7, 0.975], [2.52, 88, 0.997], [2.73, 83.4, 1], [2.88, 77, 1], [2.98, 70.9, 1], [3.08, 63.4, 1], [3.18, 54.2, 1], [3.28, 43, 1], [3.38, 29.7, 1], [3.48, 14, 1], [3.58, -4.1, 1], [3.63, -9.8, 1], [3.99, -9.8, 1]],
    one: [[0, 153.1], [0.05, 153.1], [0.15, 135.1], [0.25, 119.6], [0.4, 100.6], [0.56, 86.2], [0.71, 75.6], [0.86, 68.3], [1.01, 63.8], [1.21, 60.8], [1.56, 59], [1.72, 57], [1.87, 53.3], [2.12, 45], [2.68, 35.1], [2.93, 27], [3.03, 22], [3.18, 12.8], [3.28, 5], [3.38, -3.9], [3.48, -14.4], [3.58, -26.4], [3.69, -40], [3.79, -55.4], [3.84, -60]],
    first: { x: 68.8, y: [[0, 157.8], [0.05, 157.8], [0.2, 132.3], [0.3, 118.3], [0.4, 106.4], [0.5, 96.5], [0.6, 88.5], [0.71, 82.1], [0.86, 75.1], [1.01, 70.8], [1.21, 68], [1.61, 65.6], [1.77, 63], [2.07, 53.2], [2.22, 49.8], [2.68, 42], [2.83, 37.7], [2.93, 33.6], [3.03, 28.7], [3.18, 19.2], [3.28, 11.3], [3.38, 2.1], [3.48, -8.6], [3.58, -20.8], [3.69, -34.7], [3.79, -50.4], [3.84, -52.7], [3.99, -52.7]] },
    second: { x: 22.4, y: [[0, 141.1], [0.05, 141.1], [0.2, 115.6], [0.3, 101.7], [0.4, 89.9], [0.56, 75.7], [0.71, 65.5], [0.86, 58.6], [1.01, 54.2], [1.16, 51.9], [1.56, 49.6], [1.72, 47.4], [1.87, 43.7], [2.12, 35.3], [2.63, 26.6], [2.88, 19.2], [3.08, 9.2], [3.18, 2.6], [3.33, -9.7], [3.43, -19.7], [3.53, -31], [3.63, -44.1], [3.74, -58.9]] },
  },
}

// at the moment the stage pins, the top name has just arrived; the motion ends with everything above the stage
const LEAD = 0.9
const END = 4

/** A curve's value at t (linear between keys, held at the ends): [y, scale]. */
export function sampleCurve(keys: readonly Key[], t: number): [number, number] {
  const first = keys[0]!
  const last = keys[keys.length - 1]!
  if (t <= first[0]!) return [first[1]!, first[2] ?? 1]
  if (t >= last[0]!) return [last[1]!, last[2] ?? 1]
  let i = 1
  while (keys[i]![0]! < t) i++
  const a = keys[i - 1]!
  const b = keys[i]!
  const f = (t - a[0]!) / (b[0]! - a[0]!)
  return [a[1]! + (b[1]! - a[1]!) * f, (a[2] ?? 1) + ((b[2] ?? 1) - (a[2] ?? 1)) * f]
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

const pic = (n: number, w: number, h: number) => `https://picsum.photos/seed/mewo-names-duel-${n}/${w}/${h}`

const PIECE = "absolute top-0 -translate-x-1/2 will-change-transform motion-reduce:static motion-reduce:translate-x-0 motion-reduce:will-change-auto"
const NAME = "font-heading text-[length:min(14.375cqw,25cqh)] leading-none font-normal tracking-[-0.03em] whitespace-nowrap @max-[900px]:text-[length:min(14.93cqw,67px)]"
// picture heights: one picture, or the first and second of two
const HEIGHTS = [
  ["h-[45cqh] @max-[900px]:h-[min(80cqw,57cqh)]"],
  ["h-[37cqh] @max-[900px]:h-[min(55cqw,34.8cqh)]", "h-[31.4cqh] @max-[900px]:h-[min(46cqw,40cqh)]"],
]

/**
 * Two huge names and the pictures between them, played by scroll on a pinned stage. The first name rises and rests at
 * the top while one picture, or two as layers, drifts up; the second name follows small, and as the first shrinks
 * away it grows into its place; then everything leaves upward. Pins to its nearest scroll container, or to the page.
 * With reduced motion it is a still column: name, pictures, name.
 */
export function NamesDuel({
  top = "First ruler",
  bottom = "Second ruler",
  pictures = [{ src: pic(1, 1000, 978), ratio: 1000 / 978, credit: { title: "A carved disc", by: "c. 2300 BCE", line: "A museum somewhere. Placeholder photograph." } }],
  length = END - LEAD,
  className,
  style,
  ...props
}: NamesDuelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const topRef = React.useRef<HTMLParagraphElement>(null)
  const bottomRef = React.useRef<HTMLParagraphElement>(null)
  const pictureRefs = React.useRef<(HTMLElement | null)[]>([])
  const shown = pictures.slice(0, 2)
  const count = shown.length

  React.useEffect(() => {
    const stage = stageRef.current
    // the root's ref stays the consumer's, so the section is reached through the stage
    const section = stage?.parentElement
    if (!stage || !section || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const scroller = scrollParent(section)
    const span = Math.max(0.1, length)
    let raf = 0
    let last = NaN

    const place = (el: HTMLElement | null | undefined, [y, s]: [number, number]) => {
      if (!el) return
      el.style.translate = `-50% calc(${y.toFixed(2)}cqh - 50%)`
      el.style.scale = s.toFixed(3)
    }
    const update = () => {
      raf = 0
      // inside a scroll container the stage pins to that container, not the window
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = section.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      const t = Math.min(END, LEAD + ((-top / Math.max(1, viewport)) * (END - LEAD)) / span)
      if (t === last) return
      last = t
      const m = MOTION[stage.clientWidth >= 900 ? "wide" : "narrow"]
      stage.dataset.ready = ""
      place(topRef.current, sampleCurve(m.top, t))
      place(bottomRef.current, sampleCurve(m.bottom, t))
      if (count === 1) place(pictureRefs.current[0], sampleCurve(m.one, t))
      else {
        place(pictureRefs.current[0], sampleCurve(m.first.y, t))
        place(pictureRefs.current[1], sampleCurve(m.second.y, t))
        pictureRefs.current[0]?.style.setProperty("left", `${m.first.x}%`)
        pictureRefs.current[1]?.style.setProperty("left", `${m.second.x}%`)
      }
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
  }, [length, count])

  return (
    <section
      data-slot="names-duel"
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] text-[length:var(--story-u)]", "relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-auto", className)}
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
        <p ref={topRef} className={cn(PIECE, NAME, "left-1/2")}>
          {top}
        </p>
        <p ref={bottomRef} className={cn(PIECE, NAME, "left-1/2 scale-25 motion-reduce:scale-100")}>
          {bottom}
        </p>
        {shown.map((p, i) => (
          <PictureFigure
            key={p.src}
            ref={(el) => {
              pictureRefs.current[i] = el
            }}
            src={p.src}
            ratio={p.ratio}
            alt={p.alt ?? (p.credit ? `${p.credit.title}, ${p.credit.by}` : "")}
            caption={p.credit && <PictureCredit {...p.credit} className="gap-[calc(var(--story-u)*0.4)] [&>span:last-child]:leading-[1.2]" />}
            className={cn(PIECE, "left-1/2", HEIGHTS[count - 1]![i])}
          />
        ))}
      </div>
    </section>
  )
}
