"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/** The longest word: the cycle keeps its width so the line around it never jumps. */
export function longestWord(words: string[]) {
  return words.reduce((a, b) => (b.length > a.length ? b : a), "")
}

export interface WordCycleProps extends React.ComponentProps<"span"> {
  /** The words, shown one at a time in place. */
  words?: string[]
  /** Milliseconds each word stays. */
  interval?: number
}

/** One word at a time in a line of text: each fades and rises into place, in the width of the longest word. */
export function WordCycle({ words = ["political", "economic", "cultural"], interval = 2200, className, ...props }: WordCycleProps) {
  const [current, setCurrent] = React.useState(0)
  const sizer = React.useRef<HTMLSpanElement>(null)

  // the cycle runs only while the line is on screen (watched through its sizing span, so the root's ref stays the consumer's)
  React.useEffect(() => {
    if (words.length < 2) return
    let timer = 0
    const tick = () => {
      timer = window.setTimeout(() => {
        setCurrent((w) => (w + 1) % words.length)
        tick()
      }, interval)
    }
    const stop = () => {
      window.clearTimeout(timer)
      timer = 0
    }
    const el = sizer.current
    const observer =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry?.isIntersecting) {
                if (!timer) tick()
              } else stop()
            },
            { rootMargin: "50% 0px" }
          )
        : null
    // runs from the start (an observer reports its first state right after observe, and stops it when off screen)
    tick()
    observer?.observe(el!)
    return () => {
      stop()
      observer?.disconnect()
    }
  }, [words.length, interval])

  return (
    <span data-slot="word-cycle" className={cn("inline-grid align-top", className)} {...props}>
      {words.map((w, i) => (
        <span
          key={w}
          aria-hidden={i !== current}
          className={cn(
            "[grid-area:1/1] transition-[opacity,translate] duration-600 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none",
            i === current ? "translate-y-0 opacity-100" : "translate-y-[0.3em] opacity-0"
          )}
        >
          {w}
        </span>
      ))}
      <span ref={sizer} className="invisible [grid-area:1/1]" aria-hidden="true">
        {longestWord(words)}
      </span>
    </span>
  )
}
