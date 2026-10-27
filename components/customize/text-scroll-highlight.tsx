"use client"

import { TextScrollHighlight } from "@/registry/mewo/ui/text-scroll-highlight"
import { cn } from "@/lib/utils"
import { Input, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  text: "Words catch the light one at a time as the paragraph climbs the screen, so the eye is led down the page at whatever pace the reader chooses.",
  pin: false,
  scrollLength: 1.5,
  dimOpacity: 0.2,
  start: 0.85,
  end: 0.45,
  spread: 4,
  scrub: 0.1,
}
export const DEMO_ONLY = ["text"] as const

const percent = (value: number) => `${Math.round(value * 100)}%`

export default function TextScrollHighlightCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "TextScrollHighlight", item: "text-scroll-highlight", props: changedProps(values, defaults, DEMO_ONLY), children: values.text }}
      preview={
        // the highlight follows its nearest scroll container, so the preview scrolls inside this box; pinning changes
        // the box's layout, so the box starts over
        <div key={String(values.pin)} className="h-[420px] w-full overflow-y-auto rounded-lg border px-8">
          <p className="py-48 text-center text-sm text-muted-foreground">Scroll down</p>
          <TextScrollHighlight
            as="h2"
            pin={values.pin}
            scrollLength={values.scrollLength}
            dimOpacity={values.dimOpacity}
            start={values.start}
            end={values.end}
            spread={values.spread}
            scrub={values.scrub}
            className={cn("mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance", values.pin && "text-center")}
          >
            {values.text || " "}
          </TextScrollHighlight>
          <p className="py-24 text-center text-sm text-muted-foreground">The end</p>
        </div>
      }
    >
      <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
      <Switch label="Pin" checked={values.pin} onChange={(value) => set("pin", value, { replay: true })} />
      <Slider label="Scroll length" min={0.5} max={4} step={0.1} format={(value) => `${value} vh`} disabled={!values.pin} value={values.scrollLength} onChange={(value) => set("scrollLength", value)} />
      <Slider label="Dim" min={0} max={0.8} step={0.05} format={percent} value={values.dimOpacity} onChange={(value) => set("dimOpacity", value)} />
      <Slider label="Start" min={0.5} max={1} step={0.05} format={percent} disabled={values.pin} value={values.start} onChange={(value) => set("start", value)} />
      <Slider label="End" min={0} max={0.8} step={0.05} format={percent} disabled={values.pin} value={values.end} onChange={(value) => set("end", value)} />
      <Slider label="Spread" min={0} max={10} step={0.5} format={(value) => (value === 0 ? "Sharp" : `${value} words`)} value={values.spread} onChange={(value) => set("spread", value)} />
      <Slider label="Scrub" min={0} max={0.5} step={0.01} unit="s" value={values.scrub} onChange={(value) => set("scrub", value)} />
    </CustomizeFrame>
  )
}
