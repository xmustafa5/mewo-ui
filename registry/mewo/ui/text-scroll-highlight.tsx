"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextScrollHighlightProps extends Omit<React.ComponentProps<"p">, "children"> {
  children: string
  /** Hold the text in the middle of the viewport while the scroll lights it, like a subtitle. */
  pin?: boolean
  /** Viewport heights of scroll the pinned text is held for. Only used with `pin`. */
  scrollLength?: number
  /** Opacity of the words the scroll has not reached yet, 0 to 1. */
  dimOpacity?: number
  /** How far down the viewport, 0 to 1, the top of the text is when the first word starts to light. Not used with `pin`. */
  start?: number
  /** How far down the viewport, 0 to 1, the bottom of the text is when the last word has lit. Not used with `pin`. */
  end?: number
  /** How many words are part-lit at once. 0 switches each word on at a stroke. */
  spread?: number
  /** Seconds the highlight trails the scroll position. 0 locks to it. */
  scrub?: number
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div"
}

// Pinned text finishes lighting this far through its runway, so it is read whole before it lets go.
const PIN_SETTLE = 0.85

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** How lit word `index` of `count` is, 0 to 1, once the scroll has covered `progress` of the text. */
export function wordHighlight(index: number, count: number, progress: number, spread: number): number {
  const soft = Math.max(0, spread)
  // The last word has to finish too, so the sweep runs `soft` words past the end.
  const reached = progress * (count + soft) - index
  return soft > 0 ? clamp(reached / soft, 0, 1) : reached > 0 ? 1 : 0
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

export function TextScrollHighlight({
  children,
  pin = false,
  scrollLength = 1.5,
  dimOpacity = 0.2,
  start = 0.85,
  end = 0.45,
  spread = 4,
  scrub = 0.1,
  as: Tag = "p",
  className,
  ...props
}: TextScrollHighlightProps) {
  const wordRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const progressRef = React.useRef<number | null>(null)
  // Whitespace stays as plain text between the words, so the text wraps, selects and reads as written.
  const { units, count } = React.useMemo(() => {
    const units: { text: string; word: number }[] = []
    let count = 0
    for (const text of children.split(/(\s+)/)) {
      if (text.length === 0) continue
      units.push({ text, word: /^\s+$/.test(text) ? -1 : count++ })
    }
    return { units, count }
  }, [children])
  const dim = clamp(dimOpacity, 0, 1)

  React.useEffect(() => {
    // The root's ref stays the consumer's, so the root is reached through its first word.
    const root = wordRefs.current[0]?.parentElement
    if (!root || count === 0) return

    // Pinned, the text sits in a sticky stage inside a section as tall as its scroll runway.
    const stage = pin ? root.parentElement : null
    const section = stage?.parentElement ?? null
    const scroller = scrollParent(section ?? root)
    // Inside a scroll container the stage pins to that container, not the window.
    const fit = () => {
      if (section && scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
    }
    fit()
    // Reduced motion gets the text fully lit and unpinned by CSS, with nothing tied to the scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lag = Math.max(0, scrub)
    const shown: number[] = []
    let target = 0
    let raf = 0
    let last = 0

    const measure = () => {
      const top = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0
      if (section && stage) {
        // The text holds still, so the scroll through the section is all that moves the highlight.
        const runway = (section.offsetHeight - stage.offsetHeight) * PIN_SETTLE
        target = runway > 0 ? clamp((top - section.getBoundingClientRect().top) / runway, 0, 1) : 1
        return
      }
      const view = scroller ? scroller.clientHeight : window.innerHeight
      const rect = root.getBoundingClientRect()
      // The text's top crosses the first line to begin; its bottom crosses the second to finish.
      const begin = top + view * start
      const distance = begin - (top + view * end) + rect.height
      target = distance > 0 ? clamp((begin - rect.top) / distance, 0, 1) : 1
    }

    const render = (progress: number) => {
      for (let i = 0; i < count; i++) {
        const word = wordRefs.current[i]
        if (!word) continue
        const opacity = dim + (1 - dim) * wordHighlight(i, count, progress, spread)
        // Most words sit fully dim or fully lit; only the few in between need a write.
        if (shown[i] === opacity) continue
        shown[i] = opacity
        word.style.opacity = `${opacity}`
      }
    }

    const tick = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1)
      last = now

      let progress = progressRef.current ?? target
      progress = lag > 0 ? progress + (target - progress) * (1 - Math.exp(-dt / lag)) : target
      if (Math.abs(target - progress) < 0.0005) progress = target

      progressRef.current = progress
      render(progress)
      raf = progress === target ? 0 : requestAnimationFrame(tick)
    }

    const update = () => {
      measure()
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const resize = () => {
      fit()
      update()
    }

    measure()
    // Snap on mount; afterwards keep the eased position across prop changes.
    progressRef.current = progressRef.current ?? target
    render(progressRef.current)
    if (progressRef.current !== target) update()

    const observer = new ResizeObserver(resize)
    observer.observe(root)
    // Content loading in above the text moves it without a scroll; the page growing gives that away.
    observer.observe(scroller ?? document.body)
    // Scroll events do not bubble; capturing on the window hears a nested scroller too.
    window.addEventListener("scroll", update, { passive: true, capture: true })
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", update, { capture: true })
      window.removeEventListener("resize", resize)
    }
  }, [count, dim, pin, scrollLength, start, end, spread, scrub])

  const content = React.createElement(
    Tag,
    { "data-slot": "text-scroll-highlight", className: cn(className), ...props },
    units.map(({ text, word }, index) =>
      word < 0 ? (
        text
      ) : (
        <span
          key={index}
          ref={(el) => {
            wordRefs.current[word] = el
          }}
          data-slot="text-scroll-highlight-word"
          className="motion-reduce:opacity-100!"
          // Dim for the first paint; the effect lights each word as the scroll reaches it.
          style={{ opacity: dim }}
        >
          {text}
        </span>
      )
    )
  )

  if (!pin) return content

  return (
    <div
      data-slot="text-scroll-highlight-pin"
      className="relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-auto"
      style={{ "--mewo-length": 1 + Math.max(0, scrollLength) } as React.CSSProperties}
    >
      <div
        data-slot="text-scroll-highlight-stage"
        className="sticky top-0 flex h-[var(--mewo-viewport,100vh)] flex-col justify-center motion-reduce:static motion-reduce:h-auto"
      >
        {content}
      </div>
    </div>
  )
}
