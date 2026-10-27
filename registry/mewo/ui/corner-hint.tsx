"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CornerHintProps extends React.ComponentProps<"p"> {
  /** The hint, on wide and narrow screens. */
  hint?: { desktop: string; mobile: string }
  /** Replaces the hint while set (e.g. the name of a picked object), and shows even when `show` is false. */
  message?: string
  /** Whether the hint shows. */
  show?: boolean
}

/**
 * A glass hint in the bottom corner at the inline end (full width on phones): it grows in from a little larger
 * as it fades in, and a message can replace it for a moment. Announced politely to screen readers.
 */
export function CornerHint({
  hint = { desktop: "Select an object to read about it.", mobile: "Tap an object to read about it." },
  message,
  show = true,
  className,
  ...props
}: CornerHintProps) {
  return (
    <p
      role="status"
      data-slot="corner-hint"
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", 
        "pointer-events-none fixed z-[100] end-[calc(var(--story-u)*2)] bottom-[calc(var(--story-u)*2)] rounded-lg py-[calc(var(--story-u)*2.1)] ps-[calc(var(--story-u)*1.8)] pe-[calc(var(--story-u)*2.2)] text-[length:calc(var(--story-u)*1.4)] leading-[1.4] tracking-[-0.01em] whitespace-nowrap text-muted-foreground",
        "bg-[rgba(186,186,186,0.2)] backdrop-blur-[12px]",
        "[transition:opacity_0.5s_ease,scale_0.6s_cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none",
        "max-[900px]:start-[calc(var(--story-u)*1.5)] max-[900px]:end-[calc(var(--story-u)*1.5)] max-[900px]:p-[calc(var(--story-u)*1.6)] max-[900px]:text-center",
        message || show ? "scale-100 opacity-100" : "scale-[1.4] opacity-0",
        className
      )}
      {...props}
    >
      {message || (
        <>
          <span className="max-[900px]:hidden">{hint.desktop}</span>
          <span className="hidden max-[900px]:inline">{hint.mobile}</span>
        </>
      )}
    </p>
  )
}
