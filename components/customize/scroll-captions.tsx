"use client"

import { ScrollCaptions } from "@/registry/mewo/ui/scroll-captions"
import { cn } from "@/lib/utils"
import { Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { captions: 5, step: 0.85, place: "middle", size: "default" }
export const DEMO_ONLY = ["captions", "place", "size"] as const

// the demo's captions, then two more
const CAPTIONS = [
  <>
    Around 3000 BCE, a sculptor carved a tall <em>vessel</em> from stone.
  </>,
  "It stood in a temple, carried out for the city's festivals.",
  "Centuries later, it was buried with the temple that kept it.",
  "In the 1930s, an expedition found it, broken, with an ancient repair.",
  "Today it stands in a museum, its long journey written beside it.",
  "Each stop on the way left a mark on it.",
  "Its story is still being written by the people who study it.",
]

// where and how big the captions are is `captionClassName`; each class is written in full so its styles exist
const PLACES: Record<string, string> = { middle: "", low: "top-[79%]", top: "top-1/3" }
const SIZES: Record<string, string> = { default: "", large: "w-[min(150cqh,80cqw)] text-[min(7cqh,4.5cqw)]" }
const PLACE_OPTIONS = [
  { value: "middle", label: "Middle" },
  { value: "low", label: "Low" },
  { value: "top", label: "Upper third" },
]
const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
]

export default function ScrollCaptionsCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const captionClassName = cn(PLACES[values.place], SIZES[values.size]) || undefined
  const computed = captionClassName ? { captionClassName } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "ScrollCaptions", item: "scroll-captions", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the stage pins to its nearest scroll container, so the piece scrolls inside this box, as in the demo
        <div key={values.captions} className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background">
          <ScrollCaptions captions={CAPTIONS.slice(0, values.captions)} step={values.step} captionClassName={captionClassName} />
        </div>
      }
    >
      <Slider label="Captions" min={1} max={CAPTIONS.length} step={1} value={values.captions} onChange={(value) => set("captions", value)} />
      <Slider label="Per caption" min={0.3} max={2} step={0.05} format={(value) => `${value.toFixed(2)} screens`} value={values.step} onChange={(value) => set("step", value)} />
      <Select label="Place" options={PLACE_OPTIONS} value={values.place} onChange={(value) => set("place", value)} />
      <Select label="Size" options={SIZE_OPTIONS} value={values.size} onChange={(value) => set("size", value)} />
    </CustomizeFrame>
  )
}
