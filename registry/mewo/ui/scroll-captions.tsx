"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ScrollCaptionsProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The captions, shown one at a time in the same place as the reader scrolls. */
  captions?: React.ReactNode[]
  /** Viewport heights of scroll each caption holds. */
  step?: number
  /** Merged onto every caption: its place, width and type. */
  captionClassName?: string
  /** Called with the index of the caption that comes up (e.g. to move a timeline beside it). */
  onCaptionChange?: (index: number) => void
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

/** The caption that shows `progress` viewport heights after the stage pins: none until the section is half in view,
 * then one per `step`, the last one held to the end. */
export function captionAt(progress: number, count: number, step: number) {
  if (count === 0 || progress < -0.5) return -1
  return Math.min(count - 1, Math.max(0, Math.floor(progress / Math.max(0.01, step))))
}

/**
 * Captions that take turns in one place as the reader scrolls, on a pinned stage. The old one fades out quickly,
 * then the new one fades in while growing from 90%, fast at first and ever slower over five seconds, so two never
 * overlap. Pins to its nearest scroll container, or to the page. Changes are announced politely to screen readers.
 */
export function ScrollCaptions({
  captions = [
    <>Around 3000 BCE, a sculptor carved a tall <em>vessel</em> from stone.</>,
    "Centuries later, it was buried with the temple that kept it.",
    "In the 1930s, an expedition found it, broken, with an ancient repair.",
    "Today it stands in a museum, its long journey written beside it.",
  ],
  step = 0.85,
  captionClassName,
  onCaptionChange,
  className,
  style,
  ...props
}: ScrollCaptionsProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const onCaptionChangeRef = React.useRef(onCaptionChange)
  const [active, setActive] = React.useState(-1)
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
    let shown = -1
    let raf = 0

    const update = () => {
      raf = 0
      // Inside a scroll container the stage pins to that container, not the window.
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = section.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      const next = captionAt(-top / Math.max(1, viewport), count, step)
      if (next === shown) return
      shown = next
      setActive(next)
      if (next >= 0) onCaptionChangeRef.current?.(next)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    schedule()
    const target = scroller ?? window
    target.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      target.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [count, step])

  return (
    <section
      data-slot="scroll-captions"
      className={cn("relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))]", className)}
      style={{ "--mewo-length": 1 + count * Math.max(0, step), ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={stageRef} aria-live="polite" className="sticky top-0 h-[var(--mewo-viewport,100vh)] w-full overflow-hidden [container-type:size]">
        {captions.map((caption, i) => (
          <div
            key={i}
            data-slot="scroll-captions-caption"
            data-on={i === active ? "" : undefined}
            className={cn(
              "absolute top-1/2 left-1/2 w-[min(68cqh,72cqw)] -translate-x-1/2 -translate-y-1/2 text-center font-heading text-[min(3.35cqh,5.4cqw)] leading-[1.12] tracking-[-0.01em]",
              // leaving: a quick fade, then back to 90% out of sight
              "invisible scale-90 opacity-0 [transition:opacity_0.22s_ease-in,scale_0s_linear_0.22s,visibility_0s_linear_0.22s]",
              // coming up: after the old one has gone, a fade in and a long, slowing growth
              "data-on:visible data-on:scale-100 data-on:opacity-100 data-on:[transition:opacity_1.2s_cubic-bezier(0.215,0.61,0.355,1)_0.25s,scale_5s_cubic-bezier(0.19,1,0.22,1)_0.25s,visibility_0s]",
              // as specific as the data-on transition, so reduced motion wins over it
              "motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:data-on:transition-none",
              captionClassName
            )}
          >
            {caption}
          </div>
        ))}
      </div>
    </section>
  )
}
