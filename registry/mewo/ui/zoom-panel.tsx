"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ZoomPanelState = "hidden" | "shown" | "open"

export interface ZoomPanelProps extends React.ComponentProps<"div"> {
  /** hidden; shown as a thumbnail in the corner; open as a large panel zoomed into one band of the picture. */
  state?: ZoomPanelState
  /** The picture: a wide image (about 3 : 2) works best. */
  src?: string
  /** Its description. */
  alt?: string
  /** The caption shown in the open panel. */
  caption?: string
}

/**
 * A document in the corner that opens into a large panel: the picture grows and slides with the panel, and two
 * shades leave one band of it clear, like a highlighted line in a ledger. Positioned in its nearest positioned
 * ancestor's bottom corner at the inline end (right in left-to-right text, left in right-to-left).
 */
export function ZoomPanel({
  state = "shown",
  src = "https://picsum.photos/seed/mewo-zoom-panel-1/1600/1100",
  alt = "",
  caption = "A record, one line highlighted. Placeholder photograph.",
  className,
  ...props
}: ZoomPanelProps) {
  return (
    <div
      data-slot="zoom-panel"
      data-state={state}
      className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", 
        "group absolute end-[calc(var(--story-u)*2)] bottom-[calc(var(--story-u)*2)] h-[calc(var(--story-u)*11)] w-[calc(var(--story-u)*20)] overflow-hidden rounded-sm bg-black text-white",
        "[transition:opacity_0.5s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s,right_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),left_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),bottom_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),width_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),height_0.8s_cubic-bezier(0.455,0.03,0.515,0.955)]",
        "data-[state=hidden]:invisible data-[state=hidden]:opacity-0",
        "data-[state=hidden]:[transition:opacity_0.5s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s_linear_0.5s,right_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),left_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),bottom_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),width_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),height_0.8s_cubic-bezier(0.455,0.03,0.515,0.955)]",
        "data-[state=open]:end-[calc(var(--story-u)*12)] data-[state=open]:bottom-[4cqh] data-[state=open]:h-[92cqh] data-[state=open]:w-[calc(var(--story-u)*88)]",
        "max-[900px]:inset-x-0 max-[900px]:bottom-[calc(var(--story-u)*1.2)] max-[900px]:mx-auto max-[900px]:h-[calc(var(--story-u)*9.6)] max-[900px]:w-[calc(var(--story-u)*14)]",
        "max-[900px]:data-[state=open]:inset-x-0 max-[900px]:data-[state=open]:bottom-[calc(var(--story-u)*1.2)] max-[900px]:data-[state=open]:h-[42cqh] max-[900px]:data-[state=open]:w-[calc(100cqw-calc(var(--story-u)*4))]",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- registry items cannot use next/image */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute top-1/2 left-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-[46%]",
            "[transition:width_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),translate_0.8s_cubic-bezier(0.455,0.03,0.515,0.955)] motion-reduce:transition-none",
            "group-data-[state=open]:w-[180%] group-data-[state=open]:-translate-x-[36%]"
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[43%] bg-black/80 transition-colors duration-400 group-data-[state=open]:bg-black/55",
            "before:absolute before:inset-x-0 before:top-0 before:h-[22%] before:bg-black before:opacity-0 before:transition-opacity before:duration-400 before:content-['']",
            "group-data-[state=open]:before:opacity-100"
          )}
        />
        <div className="absolute inset-x-0 bottom-0 h-[51%] bg-black/80 transition-colors duration-400 group-data-[state=open]:bg-black/55" />
      </div>
      <span
        aria-hidden="true"
        className="absolute top-[calc(var(--story-u)*1)] left-[calc(var(--story-u)*1)] grid size-[calc(var(--story-u)*4)] place-items-center rounded-lg bg-[rgba(186,186,186,0.2)] backdrop-blur-[12px] transition-opacity duration-300 group-data-[state=open]:opacity-0"
      >
        <svg className="size-[calc(var(--story-u)*1.8)]" viewBox="0 0 16 16">
          <rect x="0.5" y="0.5" width="15" height="15" rx="2" fill="none" stroke="currentColor" />
          <rect x="9" y="1" width="6" height="6" fill="currentColor" />
        </svg>
      </span>
      <span
        aria-hidden="true"
        className="absolute top-[calc(var(--story-u)*2)] left-[calc(var(--story-u)*2)] size-[calc(var(--story-u)*4.8)] p-[calc(var(--story-u)*1.1)] opacity-0 transition-opacity duration-400 group-data-[state=open]:opacity-100 group-data-[state=open]:delay-400"
      >
        <svg viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" />
          <path d="M7 11h8" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <p className="absolute inset-x-[calc(var(--story-u)*2)] bottom-[calc(var(--story-u)*1.4)] text-[10px] leading-[1.3] opacity-0 transition-opacity duration-400 group-data-[state=open]:opacity-100 group-data-[state=open]:delay-400">
        {caption}
      </p>
    </div>
  )
}
