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

  React.useEffect(() => {
    if (words.length < 2) return
    let timer = 0
    const tick = () => {
      timer = window.setTimeout(() => {
        setCurrent((w) => (w + 1) % words.length)
        tick()
      }, interval)
    }
    tick()
    return () => window.clearTimeout(timer)
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
      <span className="invisible [grid-area:1/1]" aria-hidden="true">
        {longestWord(words)}
      </span>
    </span>
  )
}
