"use client"

import { ZoomPanelScroll } from "@/components/demos/zoom-panel-scroll"
import { ZoomPanel, type ZoomPanelState } from "@/registry/mewo/ui/zoom-panel"
import { Input, Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { driver: "scroll", state: "shown", picture: 1, caption: "A record, one line highlighted. Placeholder photograph.", alt: "" }
export const DEMO_ONLY = ["driver", "picture"] as const

const DRIVER_OPTIONS = [
  { value: "scroll", label: "The box's scroll" },
  { value: "manual", label: "The State row" },
]
const STATE_OPTIONS = ["hidden", "shown", "open"]
const srcOf = (picture: number) => `https://picsum.photos/seed/mewo-zoom-panel-${picture}/1600/1100`

export default function ZoomPanelCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, setMany, reset, replay } = useCustomize(DEFAULTS)
  const scrolled = values.driver === "scroll"
  const picture = { src: srcOf(values.picture), alt: values.alt, caption: values.caption }
  // while the box's scroll drives the panel, the state is the scroll's, not a prop the user set
  const computed = { ...(values.picture !== DEFAULTS.picture ? { src: picture.src } : {}), ...(scrolled ? { state: undefined } : {}) }
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "ZoomPanel", item: "zoom-panel", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the demo's box, a size container the open panel takes its height from; scrolling inside it sets the state as a story's scroll does
        <div key={values.driver} className="relative h-[500px] w-full overflow-hidden rounded-xl border bg-muted/40 [container-type:size] [contain:layout]">
          {scrolled ? <ZoomPanelScroll {...picture} /> : <ZoomPanel state={values.state as ZoomPanelState} {...picture} />}
        </div>
      }
    >
      {/* switching to the State row opens the panel at once, so the row shows what it is for */}
      <Select label="Driven by" options={DRIVER_OPTIONS} value={values.driver} onChange={(value) => setMany({ driver: value, state: value === "manual" ? "open" : DEFAULTS.state }, { replay: true })} />
      <Select label="State" options={STATE_OPTIONS} value={values.state} disabled={scrolled} onChange={(value) => set("state", value)} />
      <Slider label="Picture" min={1} max={9} step={1} format={(value) => `#${value}`} value={values.picture} onChange={(value) => set("picture", value)} />
      <Input label="Caption" value={values.caption} onChange={(value) => set("caption", value)} />
      <Input label="Alt" value={values.alt} placeholder="Describe the picture" onChange={(value) => set("alt", value)} />
    </CustomizeFrame>
  )
}
