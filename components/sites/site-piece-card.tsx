"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { usePreviewClip } from "@/components/site/preview-media"
import { cn } from "@/lib/utils"
import type { SitePiece } from "./protocol"

/**
 * A piece of a site, in the viewer's panel: its poster with the clip on hover or focus, and the name over the
 * poster. Its own shape, not the catalog card's: no frame, no text under the picture, a brand ring when the site's
 * inspector selected it. With `onGoto` (a site that answers the viewer) the card takes the framed site to the piece
 * and a small arrow opens the piece's page; without it the whole card opens the page.
 */
export function SitePieceCard({ piece, selected, onGoto }: { piece: SitePiece; selected: boolean; onGoto?: (name: string) => void }) {
  const { start, stop, media } = usePreviewClip(piece.name, piece.hasPreview)
  const face = (
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
  )
  const shell = cn(
    "group relative block overflow-hidden rounded-xl bg-background ring-1 ring-border transition-shadow outline-none hover:ring-foreground/40 focus-within:ring-2 focus-within:ring-ring",
    selected && "ring-2 ring-brand hover:ring-brand"
  )

  if (!onGoto) {
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
        className={cn(shell, "focus-visible:ring-2 focus-visible:ring-ring")}
      >
        {face}
      </Link>
    )
  }

  return (
    <div id={`site-piece-${piece.name}`} data-slot="site-piece-card" aria-current={selected ? "true" : undefined} onPointerEnter={start} onPointerLeave={stop} className={shell}>
      <button type="button" onClick={() => onGoto(piece.name)} onFocus={start} onBlur={stop} className="block w-full text-left outline-none">
        {face}
      </button>
      <Link
        href={`/docs/${piece.name}`}
        aria-label={`Open ${piece.title}`}
        title="Open the page"
        onFocus={start}
        onBlur={stop}
        className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}
