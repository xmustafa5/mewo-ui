"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface RisingCaptionsProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The captions, rising one after another through the view as the reader scrolls. */
  captions?: React.ReactNode[]
  /** View heights of scroll each caption takes to rise through. */
  step?: number
  /** Merged onto every caption: its width and type (text-white over a dark picture, say). */
  captionClassName?: string
  /** Called with the index of the caption that comes up. */
  onCaptionChange?: (index: number) => void
}

export type RisingCaptionsLayout = "desktop" | "tablet" | "phone"

// Each caption's rise, in a step of scroll: it fades in with its top edge at `from` (% of the view's height),
// rises steadily to `to` over SPAN of the step, and is fully shown FADE_IN into it until FADE_OUT before the end.
// The sequence starts FADE_IN in, so the first caption is already there when the stage pins.
const RISE: Record<RisingCaptionsLayout, { from: number; to: number }> = {
  desktop: { from: 61, to: 31.22 },
  tablet: { from: 54.22, to: 30.89 },
  phone: { from: 54.68, to: 31.16 },
}
const SPAN = 0.95
const FADE_IN = 0.15
const FADE_OUT = 0.3

/** The layout for a box: a wide one from 900px across, else a tablet, or a phone below an aspect of 13 : 20. */
export function layoutFor(width: number, height: number): RisingCaptionsLayout {
  if (width >= 900) return "desktop"
  return width / Math.max(1, height) >= 13 / 20 ? "tablet" : "phone"
}

/** Caption i at `progress` view heights after the stage pins, each taking `step`: [top edge (% of the view's
 * height), opacity] into out. The first is fully shown from the start. With `reduced`, each holds still half way up
 * and shows for its whole stretch. */
export function captionAt(layout: RisingCaptionsLayout, i: number, progress: number, step: number, out: number[], reduced = false) {
  const { from, to } = RISE[layout]
  const s = Math.max(0.05, step)
  const t = (progress - i * s) / s + FADE_IN
  if (reduced) {
    out[0] = (from + to) / 2
    out[1] = t >= 0 && t < SPAN ? 1 : 0
    return out
  }
  const k = Math.min(SPAN, Math.max(0, t))
  out[0] = from - ((from - to) * k) / SPAN
  out[1] = t <= 0 || t >= SPAN ? 0 : Math.min(1, t / FADE_IN, (SPAN - t) / FADE_OUT)
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
 * Captions that rise one after another through the middle of a pinned stage as the reader scrolls, slower than the
 * page: the first is there from the start; each climbs steadily and fades out before it reaches the top, and the
 * next fades in low and follows. Pins to its nearest scroll container, or to the page. Only transform and opacity
 * change as it scrolls.
 */
export function RisingCaptions({
  captions = [
    "Who carved it, and why it was buried, are not recorded.",
    "Each repair, find and move left a trace.",
    "Some are written in museum ledgers.",
    "Others survive only in photographs.",
    "Following one object's path is the work of provenance research.",
  ],
  step = 1,
  captionClassName,
  onCaptionChange,
  className,
  style,
  ...props
}: RisingCaptionsProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const onCaptionChangeRef = React.useRef(onCaptionChange)
  const count = captions.length

  React.useEffect(() => {
    onCaptionChangeRef.current = onCaptionChange
  })

  React.useEffect(() => {
    const stage = stageRef.current
    // The root's ref stays the consumer's, so the section is reached through the stage.
    const section = stage?.parentElement
    if (!stage || !section) return
    const scroller = scrollParent(section)
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const items = [...stage.querySelectorAll<HTMLElement>('[data-slot="rising-captions-caption"]')]
    const out = [0, 0]
    let widths: number[] = []
    let layout: RisingCaptionsLayout = "desktop"
    let width = 1
    let height = 1
    let near = true
    let shown = -1
    let raf = 0
    const last: string[] = []

    const measure = () => {
      // Inside a scroll container the stage pins to that container, not the window.
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      width = Math.max(1, stage.clientWidth)
      height = Math.max(1, stage.clientHeight)
      layout = layoutFor(width, height)
      widths = items.map((el) => el.offsetWidth)
      last.length = 0
    }
    const update = () => {
      raf = 0
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = section.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      const progress = -top / Math.max(1, viewport)
      let best = -1
      let bestOpacity = 0
      items.forEach((el, i) => {
        const [y, o] = captionAt(layout, i, progress, step, out, reduced) as [number, number]
        if (o > bestOpacity) {
          best = i
          bestOpacity = o
        }
        const key = `${layout}|${y.toFixed(2)}|${o.toFixed(3)}`
        if (key === last[i]) return
        last[i] = key
        el.style.transform = `translate(${((width - widths[i]!) / 2).toFixed(1)}px, ${((y / 100) * height).toFixed(1)}px)`
        el.style.opacity = o.toFixed(3)
        el.style.visibility = o < 0.002 ? "hidden" : "visible"
      })
      if (best !== shown) {
        shown = best
        if (best >= 0) onCaptionChangeRef.current?.(best)
      }
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
    // far from view it doesn't measure on every scroll (against the window, so a scroll box leaving the page counts)
    const intersection = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting)
        if (near) {
          last.length = 0
          schedule()
        }
      },
      { rootMargin: "50% 0px" }
    )
    intersection.observe(section)
    const target = scroller ?? window
    target.addEventListener("scroll", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      target.removeEventListener("scroll", schedule)
    }
  }, [count, step])

  return (
    <section
      data-slot="rising-captions"
      className={cn("relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))]", className)}
      style={{ "--mewo-length": 1 + count * Math.max(0.05, step), ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={stageRef} data-slot="rising-captions-stage" className="sticky top-0 h-[var(--mewo-viewport,100vh)] w-full overflow-hidden [container-type:size]">
        {captions.map((caption, i) => (
          <p
            key={i}
            data-slot="rising-captions-caption"
            className={cn(
              "invisible absolute top-0 left-0 w-[min(105cqh,84cqw)] text-center font-heading text-[length:min(5.2cqh,7.5cqw)] leading-[1.12] tracking-[-0.01em] opacity-0 will-change-transform",
              captionClassName
            )}
          >
            {caption}
          </p>
        ))}
      </div>
    </section>
  )
}
