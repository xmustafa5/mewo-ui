"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type IntroWordmarkStage = "hidden" | "center" | "top"

export interface IntroWordmarkProps extends React.ComponentProps<"p"> {
  /** "hidden" before the intro, "center" while the page loads (mid-screen), "top" once it has moved up. */
  stage?: IntroWordmarkStage
  /** At the very top of the page. Scrolled away, it hides on wide screens (a CornerWordmark takes over), while
   * phones keep it. */
  atTop?: boolean
}

/**
 * A story's name as the page loads: it fades in mid-screen, then moves up to the top centre. White and
 * difference-blended, so it reads over light and dark pictures alike; give it no positioned wrapper, or it blends
 * with nothing. Hidden from screen readers: the page's own heading names the story.
 */
export function IntroWordmark({ stage = "top", atTop = true, className, children = "Atlas", ...props }: IntroWordmarkProps) {
  const shown = stage !== "hidden" && atTop
  return (
    <p
      aria-hidden="true"
      data-slot="intro-wordmark"
      data-stage={stage}
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] text-[length:var(--story-u)]", 
        "pointer-events-none fixed left-1/2 z-[100] -translate-x-1/2 font-heading text-[length:calc(var(--story-u)*4.3)] leading-none tracking-[-0.02em] whitespace-nowrap text-white mix-blend-difference max-[900px]:text-[length:calc(var(--story-u)*2)] motion-reduce:transition-none",
        stage !== "top"
          ? "top-[calc(50%-calc(var(--story-u)*2))] [transition:opacity_0.6s_ease] max-[900px]:top-[calc(50%-calc(var(--story-u)*1.2))]"
          : shown
            ? "top-[5cqh] [transition:opacity_0.2s_ease,top_0.6s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s] max-[900px]:top-[calc(var(--story-u)*2.6)]"
            : "top-[5cqh] [transition:opacity_0.2s_ease,top_0.6s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s_linear_0.2s] max-[900px]:top-[calc(var(--story-u)*2.6)]",
        shown ? "visible opacity-100" : "invisible opacity-0",
        stage !== "hidden" && "max-[900px]:visible max-[900px]:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}
