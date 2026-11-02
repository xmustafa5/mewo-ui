"use client"

import Link from "next/link"
import { Window } from "@/components/site/home/window"
import { usePreviewClip } from "@/components/site/preview-media"
import { cn } from "@/lib/utils"

export type StudioExampleProps = {
  /** The background's registry name: its poster and clip are the catalog's. */
  name: string
  title: string
  description: string
  /** The preset labels, and the one on the stage. */
  presets: string[]
  chosen: string
  /** Three of the controls, at the preset's values; `at` is the knob's place on the track. */
  sliders: { label: string; value: string; at: string }[]
  /** The Studio, opened on this background and preset. */
  href: string
  hasPreview: boolean
}

const EXPORTS = ["Code", "PNG", "Video"]
const SAMPLES = ["Landing page", "Phone", "Card"]

/**
 * The Background Studio as a picture, with one background on its stage: the catalog's poster of the background
 * (its clip while hovered), the presets and three of the controls drawn beside it, the exports over the stage.
 * Nothing runs; the whole picture opens the Studio on the same background and preset.
 */
export function StudioExample({ name, title, description, presets, chosen, sliders, href, hasPreview }: StudioExampleProps) {
  const { start, stop, media } = usePreviewClip(name, hasPreview)
  return (
    <Link
      href={href}
      aria-label={`Open ${title} in the Studio`}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Window title="mewo-ui.com/studio" className="transition-[border-color] group-hover:border-foreground/30">
        <div aria-hidden className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_17rem]">
          {/* the stage: the background, named, with the exports the studio offers */}
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-background">
            {media}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {title} · {chosen}
              </span>
              <span className="flex gap-1">
                {EXPORTS.map((kind) => (
                  <span key={kind} className="rounded-md bg-black/45 px-1.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    {kind}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* the panel: what the background is, its presets, three of its controls */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-3.5">
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em]">{title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((label) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium text-muted-foreground",
                      label === chosen && "border-foreground/40 bg-accent text-foreground"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">Sample content</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((label, index) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium text-muted-foreground",
                      index === 0 && "border-foreground/40 bg-accent text-foreground"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">Customize</p>
              <ul className="space-y-1.5">
                {sliders.map((row) => (
                  <li key={row.label} className="relative h-7.5 overflow-hidden rounded-md bg-foreground/5 text-[11px] font-medium">
                    <span className="absolute inset-y-0 left-0 rounded-md bg-brand/20" style={{ width: row.at }} />
                    <span className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground">{row.label}</span>
                    <span className="absolute top-1/2 right-2 -translate-y-1/2 text-foreground tabular-nums">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
              Every control, sample content over the stage, undo, and the export: in the Studio.
            </p>
          </div>
        </div>
      </Window>
    </Link>
  )
}
