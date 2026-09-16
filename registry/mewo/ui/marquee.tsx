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
          aria-hidden={copy > 0 ? true : undefined}
          inert={copy > 0 ? true : undefined}
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
