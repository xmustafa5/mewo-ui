"use client"

import * as React from "react"
import { ScrollPortal, type ScrollPortalScene } from "@/registry/mewo/ui/scroll-portal"
import { Color } from "./color-picker"
import { Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize, useIsLight } from "./use-customize"

/** An empty accent means the piece's own: a faint tint of the theme foreground. */
export const DEFAULTS = { count: 5, frameDepth: 1, scrollLength: 1, frameRadius: 16, frameBorder: 1, scrub: 0.35, hold: 0, dim: 0.55, dimColor: "#000000", accent: "" }
export const DEMO_ONLY = ["count"] as const

// what the piece's default frame border is, by theme: 18% of the foreground, which the picker shows until a colour is chosen
const INK = { dark: "#ffffff2e", light: "#18181b2e" }
const NAMES = ["Threshold", "Drift", "Ember", "Tidal", "Zenith"]
// each scene sits a little further from the page background, in light and dark
const SCENES: ScrollPortalScene[] = NAMES.map((name, index) => ({
  background: `color-mix(in oklch, var(--foreground) ${index * 4}%, var(--background))`,
  content: <p className="absolute bottom-[8%] left-[6%] text-3xl font-medium tracking-tight">{name}</p>,
}))
const percent = (value: number) => `${Math.round(value * 100)}%`

export default function ScrollPortalCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const light = useIsLight()
  const scenes = React.useMemo(() => SCENES.slice(0, values.count), [values.count])
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "ScrollPortal", item: "scroll-portal", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={
        // the portal pins to its nearest scroll container, so the preview scrolls inside this box
        <div key={values.count} className="h-[500px] w-full overflow-y-auto rounded-lg border">
          <ScrollPortal
            scenes={scenes}
            frameDepth={values.frameDepth}
            scrollLength={values.scrollLength}
            frameRadius={values.frameRadius}
            frameBorder={values.frameBorder}
            scrub={values.scrub}
            hold={values.hold}
            dim={values.dim}
            dimColor={values.dimColor}
            accent={values.accent || undefined}
          />
        </div>
      }
    >
      <Slider label="Scenes" min={2} max={5} step={1} value={values.count} onChange={(value) => set("count", value, { replay: true })} />
      <Slider label="Depth" min={0.2} max={3} step={0.1} format={(value) => `${value}×`} value={values.frameDepth} onChange={(value) => set("frameDepth", value)} />
      <Slider label="Scroll length" min={0.5} max={3} step={0.1} format={(value) => `${value} vh`} value={values.scrollLength} onChange={(value) => set("scrollLength", value)} />
      <Slider label="Radius" min={0} max={64} step={2} unit="px" value={values.frameRadius} onChange={(value) => set("frameRadius", value)} />
      <Slider label="Border" min={0} max={6} step={0.5} unit="px" value={values.frameBorder} onChange={(value) => set("frameBorder", value)} />
      <Slider label="Scrub" min={0} max={1.5} step={0.05} unit="s" value={values.scrub} onChange={(value) => set("scrub", value)} />
      <Slider label="Hold" min={0} max={0.9} step={0.05} format={percent} value={values.hold} onChange={(value) => set("hold", value)} />
      <Slider label="Dim" min={0} max={1} step={0.05} format={percent} value={values.dim} onChange={(value) => set("dim", value)} />
      <Color label="Dim colour" value={values.dimColor} onChange={(value) => set("dimColor", value)} />
      <Color label="Accent" alpha value={values.accent || (light ? INK.light : INK.dark)} onChange={(value) => set("accent", value)} />
    </CustomizeFrame>
  )
}
