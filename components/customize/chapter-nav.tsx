"use client"

import { cn } from "@/lib/utils"
import { ChapterNav } from "@/registry/mewo/ui/chapter-nav"
import { Input, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { chapters: 3, position: 24, title: "Chapters", brand: "Atlas", copyright: "© Atlas", visible: true, open: false }
// `chapters` is a count and `position` the reader's place, both the demo's own; `open` is the demo's switch for a panel a
// page leaves to the nav (a usage with `open` and no handler would hold it open).
export const DEMO_ONLY = ["chapters", "position", "open"] as const

// the piece's own three chapters first, so the default count shows the demo's nav exactly
const TITLES = ["One object, many keepers", "Empires and capitals", "Scattered and recovered", "Home again", "What remains"]
const STARTS = [0, 18.6, 51.5, 74, 96]

export default function ChapterNavCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const chapters = TITLES.slice(0, values.chapters).map((title, index) => ({ title, start: STARTS[index] ?? 0 }))
  // the story runs thirty viewport heights past the last chapter's start, as the piece's own bounds do
  const end = (STARTS[values.chapters - 1] ?? 0) + 30
  const position = Math.min(values.position, end)
  const computed = position !== DEFAULTS.position ? { progress: position } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "ChapterNav", item: "chapter-nav", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the demo's box: layout-contained, so the nav's fixed dots and panel stay in the frame. The preview shows the
        // nav larger and in the middle: the rail centred, the panel centred on it and opening out of it (on a page the
        // nav keeps to the inline end, at its own size)
        <div
          className={cn(
            "relative h-[500px] w-full overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]",
            // the rail at its own unit; the panel's unit also keeps it inside the box's height
            "[&>[data-slot=chapter-nav]]:[--rail-u:min(14px,1.6cqw)]",
            "[&>[data-slot=chapter-nav]>button]:[--story-u:var(--rail-u)]!",
            "[&>[data-slot=chapter-nav]>section]:[--story-u:min(14px,1.6cqw,2.1cqh)]!",
            "[&>[data-slot=chapter-nav]>button]:end-[calc(50%-var(--story-u)*2)]!",
            "[&>[data-slot=chapter-nav]>section]:end-[calc(50%-var(--story-u)*25.4)]!",
            // closed, the panel's clip is the rail it opens out of, in the middle
            "[&>[data-slot=chapter-nav]>section]:[clip-path:inset(calc((50%-var(--rail-u)*4.5)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*2)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*4.5)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*2)*(1-var(--chapter-nav-reveal)))_round_calc(var(--story-u)*1.2))]!",
          )}
        >
          <ChapterNav
            chapters={chapters}
            progress={position}
            title={values.title}
            brand={values.brand}
            copyright={values.copyright}
            visible={values.visible}
            open={values.open}
            onOpenChange={(open) => set("open", open)}
            onChapter={(start) => set("position", start)}
          />
        </div>
      }
    >
      <Slider label="Chapters" min={2} max={TITLES.length} step={1} value={values.chapters} onChange={(value) => set("chapters", value)} />
      <Slider label="Position" min={0} max={end} step={0.5} unit=" vh" value={position} onChange={(value) => set("position", value)} />
      <Input label="Title" value={values.title} onChange={(value) => set("title", value)} />
      <Input label="Wordmark" value={values.brand} onChange={(value) => set("brand", value)} />
      <Input label="Small line" value={values.copyright} onChange={(value) => set("copyright", value)} />
      <Switch label="Visible" checked={values.visible} onChange={(value) => set("visible", value)} />
      <Switch label="Open" checked={values.open} onChange={(value) => set("open", value)} />
    </CustomizeFrame>
  )
}
