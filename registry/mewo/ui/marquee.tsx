"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface MarqueeProps extends React.ComponentProps<"div"> {
  direction?: "left" | "right"
  /** Seconds for one full loop. */
  speed?: number
  pauseOnHover?: boolean
  /** Copies of the children in the track. The loop is only seamless while (repeat - 1) copies cover the container. */
  repeat?: number
}

// Anything sequentially focusable by default, plus anything an author opted in with tabindex.
const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'

export function Marquee({
  children,
  direction = "left",
  speed = 30,
  pauseOnHover = true,
  repeat = 4,
  className,
  style,
  ...props
}: MarqueeProps) {
  // The duplicated tracks are what the loop paints for most of its cycle, so they have to stay
  // clickable and selectable — `inert` would take all of that away along with focus, retargeting
  // pointer events to the root and blocking text selection. aria-hidden keeps a duplicate out of
  // the accessibility tree; tabindex="-1" on its focusable descendants keeps it out of the tab
  // order, so focus never lands in a subtree that announces nothing (WCAG 4.1.2). A ref callback
  // declared here is a new function on every render, so React re-runs it whenever the children
  // change — and it runs during commit, before the first paint.
  const dropFromTabOrder = (track: HTMLDivElement | null) => {
    track?.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((element) => {
      element.tabIndex = -1
    })
  }

  return (
    <div
      data-slot="marquee"
      className={cn("group flex overflow-hidden [--gap:1.5rem]", className)}
      style={{ "--marquee-duration": `${speed}s`, ...style } as React.CSSProperties}
      {...props}
    >
      {Array.from({ length: repeat }, (_, copy) => (
        <div
          key={copy}
          ref={copy > 0 ? dropFromTabOrder : undefined}
          data-marquee-copy={copy > 0 ? "duplicate" : "original"}
          aria-hidden={copy > 0 ? true : undefined}
          className={cn(
            "flex shrink-0 items-center gap-[var(--gap)] pr-[var(--gap)]",
            "motion-safe:animate-[mewo-marquee_var(--marquee-duration)_linear_infinite]",
            direction === "right" && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
