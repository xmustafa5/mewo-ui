"use client"

import Link from "next/link"
import { usePreviewClip } from "@/components/site/preview-media"
import { cn } from "@/lib/utils"
import type { SitePiece } from "./protocol"

/**
 * A piece of a site, in the viewer's panel: its poster with the clip on hover or focus, and the name over the
 * poster. Its own shape, not the catalog card's: no frame, no text under the picture, a brand ring when the site's
 * inspector selected it.
 */
export function SitePieceCard({ piece, selected }: { piece: SitePiece; selected: boolean }) {
  const { start, stop, media } = usePreviewClip(piece.name, piece.hasPreview)

  return (
    <Link
      id={`site-piece-${piece.name}`}
      href={`/docs/${piece.name}`}
      data-slot="site-piece-card"
      aria-current={selected ? "true" : undefined}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      className={cn(
        "group block overflow-hidden rounded-xl bg-background ring-1 ring-border transition-shadow outline-none hover:ring-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-brand hover:ring-brand"
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-background">
        {media}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/75 via-black/35 to-transparent px-3 pt-10 pb-2.5">
          <span className="text-sm leading-tight font-semibold text-white drop-shadow-sm">{piece.title}</span>
          {piece.unlisted ? (
            <span className="shrink-0 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">simple</span>
          ) : null}
        </div>
        {selected ? (
          <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-brand px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.06em] text-brand-foreground uppercase shadow-sm">
            Selected
          </span>
        ) : null}
      </div>
    </Link>
  )
}
