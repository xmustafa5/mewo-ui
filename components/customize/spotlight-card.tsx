"use client"

import { SpotlightCard } from "@/registry/mewo/ui/spotlight-card"
import { cn } from "@/lib/utils"
import { Color } from "./color-picker"
import { Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize, useIsLight } from "./use-customize"

/** An empty colour means the piece's own default: a soft tint of the theme foreground. */
export const DEFAULTS = { spotlightColor: "", width: 320, corners: "round" }
export const DEMO_ONLY = ["width", "corners"] as const

// what the piece's default glow is, by theme: 12% of the foreground, which the picker shows until a colour is chosen
const INK = { dark: "#ffffff1f", light: "#18181b1f" }
const CORNERS: Record<string, string> = { soft: "rounded-lg", round: "rounded-xl", rounder: "rounded-3xl" }
const CORNER_OPTIONS = [
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
  { value: "rounder", label: "Rounder" },
]

export default function SpotlightCardCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const light = useIsLight()
  // the corners travel as a className in the usage, the width is the demo's own
  const computed = values.corners !== DEFAULTS.corners ? { className: CORNERS[values.corners] } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{
        name: "SpotlightCard",
        item: "spotlight-card",
        props: changedProps(values, defaults, DEMO_ONLY, computed),
        children: '<h2 className="font-semibold">Move your pointer</h2>\n<p className="mt-2 text-sm text-muted-foreground">The glow follows you across the card.</p>',
      }}
      preview={
        <SpotlightCard spotlightColor={values.spotlightColor || undefined} className={cn("max-w-full", CORNERS[values.corners])} style={{ width: values.width }}>
          <h2 className="font-semibold">Move your pointer</h2>
          <p className="mt-2 text-sm text-muted-foreground">The glow follows you across the card. It fades out when you leave.</p>
        </SpotlightCard>
      }
    >
      <Color label="Spotlight" alpha value={values.spotlightColor || (light ? INK.light : INK.dark)} onChange={(value) => set("spotlightColor", value)} />
      <Slider label="Width" min={240} max={560} step={8} unit="px" value={values.width} onChange={(value) => set("width", value)} />
      <Select label="Corners" options={CORNER_OPTIONS} value={values.corners} onChange={(value) => set("corners", value)} />
    </CustomizeFrame>
  )
}
