"use client"

import { StageFrame } from "@/components/demos/stage-frame"
import tracks from "@/components/demos/date-timeline-tracks.json"
import { DateTimeline } from "@/registry/mewo/ui/date-timeline"
import type { StageTrackSet } from "@/registry/mewo/ui/scroll-stage"
import { Input, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

const ALL = ["c. 3000 BCE", "c. 2300 BCE", "1850s", "1920s", "1930s", "Today"]
// the dates the piece shows on its own
const OWN = ["c. 3000 BCE", "1850s", "1930s"]

export const DEFAULTS = { count: 6, list: ALL.join(", "), size: 2 }
export const DEMO_ONLY = ["count", "list", "size"] as const

export default function DateTimelineCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  // the piece keys each date by its text, so a repeated one is shown once
  const dates = Array.from(
    new Set(
      values.list
        .split(",")
        .map((date) => date.trim())
        .filter(Boolean),
    ),
  ).slice(0, values.count)
  const computed = JSON.stringify(dates) !== JSON.stringify(OWN) ? { dates } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "DateTimeline", item: "date-timeline", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the line slides its gap to each date as the story is read: scroll inside the frame. The stage is wider than
        // the frame, so the timeline in its middle shows at about its size on a wide page. The stage binds its pieces
        // when it mounts, so a new date list or size starts the frame over
        <StageFrame key={`${values.size}|${dates.join("|")}`} tracks={tracks as unknown as StageTrackSet} length={10.3} scale={values.size} start={0.3} className="aspect-auto h-[500px] bg-transparent">
          <DateTimeline track="a1" dates={dates} />
        </StageFrame>
      }
    >
      <Slider label="Count" min={1} max={ALL.length} step={1} value={values.count} onChange={(value) => set("count", value, { replay: true })} />
      <Input label="Dates" value={values.list} placeholder="Comma separated" onChange={(value) => set("list", value, { replay: true })} />
      <Slider label="Size" min={1} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.size} onChange={(value) => set("size", value, { replay: true })} />
    </CustomizeFrame>
  )
}
