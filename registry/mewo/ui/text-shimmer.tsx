"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextShimmerProps extends Omit<React.ComponentProps<"span">, "children"> {
  children: string
  /** Seconds for one light sweep. */
  duration?: number
}

export function TextShimmer({ children, duration = 2, className, style, ...props }: TextShimmerProps) {
  return (
    <span
      data-slot="text-shimmer"
      className={cn(
        "inline-block bg-[linear-gradient(110deg,var(--color-muted-foreground)_35%,var(--color-foreground)_50%,var(--color-muted-foreground)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent",
        "motion-safe:animate-[shimmer_var(--shimmer-duration)_linear_infinite]",
        className
      )}
      style={{ "--shimmer-duration": `${duration}s`, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </span>
  )
}
