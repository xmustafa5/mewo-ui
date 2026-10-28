"use client"

import { RisingCaptions } from "@/registry/mewo/ui/rising-captions"
import { Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { captions: 5, step: 1 }
export const DEMO_ONLY = ["captions"] as const

// the piece's own captions, so the default count shows the demo exactly
const CAPTIONS = [
  "Who carved it, and why it was buried, are not recorded.",
  "Each repair, find and move left a trace.",
  "Some are written in museum ledgers.",
  "Others survive only in photographs.",
  "Following one object's path is the work of provenance research.",
]

export default function RisingCaptionsCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "RisingCaptions", item: "rising-captions", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={
        // the stage pins to its nearest scroll container, so the piece scrolls inside this box, as in the demo
        <div key={values.captions} className="h-[500px] w-full overflow-y-auto rounded-xl border">
          <RisingCaptions captions={CAPTIONS.slice(0, values.captions)} step={values.step} />
        </div>
      }
    >
      <Slider label="Captions" min={1} max={CAPTIONS.length} step={1} value={values.captions} onChange={(value) => set("captions", value)} />
      <Slider label="Per caption" min={0.5} max={2.5} step={0.1} format={(value) => `${value.toFixed(1)} screens`} value={values.step} onChange={(value) => set("step", value)} />
    </CustomizeFrame>
  )
}
