"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DateTimelineProps extends React.ComponentProps<"div"> {
  /** The dates, in order. */
  dates?: string[]
  /** The track names' prefix inside a ScrollStage: the frame is `<track>.timeline`, the sliding line
   * `<track>.timelineLine` (relative to the frame) and each date `<track>.year<i>`. */
  track?: string
}

/**
 * A short line with a gap in the middle, and the dates. Inside a ScrollStage the tracks slide the line so the gap
 * comes to the current date, and bring each date into it; elsewhere the parts lay out in order. Its own element takes
 * no space (display: contents).
 */
export function DateTimeline({ dates = ["c. 3000 BCE", "1850s", "1930s"], track, className, ...props }: DateTimelineProps) {
  const name = (part: string) => (track ? `${track}.${part}` : undefined)
  return (
    <div data-slot="date-timeline" className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] text-[length:var(--story-u)]", "contents", className)} {...props}>
      <div data-track={name("timeline")} className="h-[2px] w-[calc(var(--story-u)*46)] overflow-hidden max-[900px]:w-[calc(100cqw-calc(var(--story-u)*4))]">
        <div data-track={name("timelineLine")} data-track-rel={track ? "1" : undefined} className="flex h-[2px] w-[calc(var(--story-u)*92)] justify-between max-[900px]:w-[calc(200cqw-calc(var(--story-u)*8))]">
          {/* a 10rem gap in the middle for the date */}
          <span className="h-[2px] w-[calc(var(--story-u)*41)] bg-foreground max-[900px]:w-[calc(100cqw-calc(var(--story-u)*9))]" />
          <span className="h-[2px] w-[calc(var(--story-u)*41)] bg-foreground max-[900px]:w-[calc(100cqw-calc(var(--story-u)*9))]" />
        </div>
      </div>
      {dates.map((date, i) => (
        <p key={date} data-track={name(`year${i}`)} className="text-[length:max(11px,calc(var(--story-u)*1.4))] font-semibold tracking-[-0.01em] whitespace-nowrap max-[900px]:text-[length:calc(var(--story-u)*1.4)]">
          {date}
        </p>
      ))}
    </div>
  )
}
