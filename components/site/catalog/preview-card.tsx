"use client"

import Link from "next/link"
import { usePreviewClip } from "@/components/site/preview-media"
import type { CatalogEntry } from "./catalog-filter"

/**
 * A catalog card: a poster of the component, and a short clip of it in motion while the card is hovered or
 * focused. Nothing runs until then (see `usePreviewClip`).
 */
export function PreviewCard({ entry, badge }: { entry: CatalogEntry; badge?: string }) {
  const { start, stop, media } = usePreviewClip(entry.name, entry.hasPreview)

  return (
    <Link
      href={`/docs/${entry.name}`}
      data-slot="preview-card"
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group block rounded-2xl bg-card/60 p-1.5 ring-1 ring-border transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-border/60">
        {media}
        {badge ? (
          <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-brand px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.06em] text-brand-foreground uppercase shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-2.5 pt-3 pb-2">
        <h3 className="text-[14.5px] leading-tight font-semibold tracking-[-0.015em] transition-colors group-hover:text-brand-text">
          {entry.title}
        </h3>
        <p className="mt-1.5 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">
          {entry.groupLabel}
        </p>
      </div>
    </Link>
  )
}
