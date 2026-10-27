"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PictureFigureProps extends Omit<React.ComponentProps<"figure">, "children"> {
  src?: string
  /** Width ÷ height of the frame. Its height comes from className. */
  ratio?: number
  alt?: string
  /** Hangs under the picture, centred and at least 32rem wide (e.g. a credit). */
  caption?: React.ReactNode
}

/** A picture at its proportions, its height set by className, with a caption hanging under it that takes no room. */
export function PictureFigure({
  src = "https://picsum.photos/seed/mewo-picture-figure-1/800/1000",
  ratio = 4 / 5,
  alt = "",
  caption,
  className,
  ...props
}: PictureFigureProps) {
  return (
    <figure data-slot="picture-figure" className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)] [--spacing:calc(var(--story-u)*0.25)]", "relative m-0", className)} {...props}>
      <div className="relative h-full overflow-hidden" style={{ aspectRatio: String(ratio) }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- items cannot use next/image */}
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
      </div>
      {caption && <figcaption className="absolute top-full left-1/2 w-[max(100%,calc(var(--story-u)*32))] -translate-x-1/2 pt-[calc(var(--story-u)*1.8)]">{caption}</figcaption>}
    </figure>
  )
}
