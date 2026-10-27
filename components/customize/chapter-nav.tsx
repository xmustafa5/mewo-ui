"use client"

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
      usage={{ name: "ChapterNav", item: "chapter-nav", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the demo's box: layout-contained, so the nav's fixed dots and panel stay in the frame
        <div className="relative h-[70vh] w-full overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]">
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
