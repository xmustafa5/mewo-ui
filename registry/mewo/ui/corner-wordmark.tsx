"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CornerWordmarkProps extends React.ComponentProps<"a"> {
  /** Whether it shows (e.g. once the reader has scrolled away from the top). */
  show?: boolean
  /** Read after the name by screen readers. */
  homeLabel?: string
  /** Called on click in place of following href (e.g. to scroll a story back to its start). */
  onHome?: () => void
}

/**
 * The name in the top inline-start corner, linking back to the start. It fades in and out with `show`, and is
 * hidden on phones, where an IntroWordmark stays at the top instead. White and difference-blended, like it.
 */
export function CornerWordmark({
  show = true,
  homeLabel = "back to the start",
  onHome,
  href = "#top",
  onClick,
  className,
  children = "Atlas",
  ...props
}: CornerWordmarkProps) {
  return (
    <a
      href={href}
      data-slot="corner-wordmark"
      onClick={(e) => {
        onClick?.(e)
        if (!onHome || e.defaultPrevented) return
        e.preventDefault()
        onHome()
      }}
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] text-[length:var(--story-u)]", 
        "fixed top-[calc(var(--story-u)*2)] start-[calc(var(--story-u)*2)] z-[100] font-heading text-[length:calc(var(--story-u)*3.3)] leading-none tracking-[-0.02em] whitespace-nowrap text-white no-underline mix-blend-difference max-[900px]:hidden motion-reduce:transition-none",
        show
          ? "visible opacity-100 [transition:opacity_0.8s_ease,visibility_0s]"
          : "invisible opacity-0 [transition:opacity_0.8s_ease,visibility_0s_linear_0.8s]",
        className
      )}
      {...props}
    >
      {/* the space sits outside the hidden span: inside it, the accessible name loses it ("Atlas– back…") */}
      {children} <span className="sr-only">– {homeLabel}</span>
    </a>
  )
}
