"use client"

import { DotGrid, type DotGridShape } from "@/registry/mewo/ui/dot-grid"
import { Color } from "./color-picker"
import { Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps, Primitive } from "./types"
import { changedProps } from "./usage"
import { serialize, useCustomize } from "./use-customize"

export const DEFAULTS = { preset: "classic", baseColor: "#3a3446", activeColor: "#ffffff", shape: "circle", dotSize: 5, gap: 18, proximity: 140, strength: 1, bounce: 0.6, swell: 0.8, glow: 0.5 }
export const DEMO_ONLY = ["preset"] as const

// on a light page the dots are grey and light up to ink, with less halo
const LIGHT = { baseColor: "#d4d4d8", activeColor: "#18181b", glow: 0.25 }

// the Studio's presets: what each one sets over the defaults
const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
  classic: {},
  cobalt: { baseColor: "#1b1f3a", activeColor: "#6b8cff", glow: 0.9 },
  square: { shape: "square", dotSize: 4, gap: 14, swell: 1.2 },
  loose: { gap: 32, dotSize: 6, proximity: 220, strength: 1.5, bounce: 0.8 },
}
const PRESET_OPTIONS = Object.keys(PRESETS)
const SHAPE_OPTIONS = ["circle", "square"]

export default function DotGridCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, setMany, reset, replay } = useCustomize(DEFAULTS, { light: LIGHT })
  const props = changedProps(values, defaults, DEMO_ONLY)
  const studio = new URLSearchParams({ bg: "dot-grid" })
  for (const [key, value] of Object.entries(props)) studio.set(key, serialize(value as Primitive))
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      studioHref={`/studio?${studio}`}
      usage={{ name: "DotGrid", item: "dot-grid", props }}
      preview={
        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-background">
          <DotGrid
            className="absolute inset-0"
            baseColor={values.baseColor}
            activeColor={values.activeColor}
            shape={values.shape as DotGridShape}
            dotSize={values.dotSize}
            gap={values.gap}
            proximity={values.proximity}
            strength={values.strength}
            bounce={values.bounce}
            swell={values.swell}
            glow={values.glow}
          />
          <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Dot Grid</h2>
            <p className="mt-2 text-muted-foreground">Move the pointer to push the dots. Click for a shockwave.</p>
          </div>
        </div>
      }
    >
      {/* a preset starts over from the defaults, as the Studio does, and pops in again */}
      <Select label="Preset" options={PRESET_OPTIONS} value={values.preset} onChange={(preset) => setMany({ ...defaults, ...PRESETS[preset], preset }, { replay: true })} />
      <Color label="Base color" value={values.baseColor} onChange={(value) => set("baseColor", value)} />
      <Color label="Active color" value={values.activeColor} onChange={(value) => set("activeColor", value)} />
      <Select label="Shape" options={SHAPE_OPTIONS} value={values.shape} onChange={(value) => set("shape", value)} />
      <Slider label="Dot size" min={2} max={16} step={1} unit="px" value={values.dotSize} onChange={(value) => set("dotSize", value)} />
      <Slider label="Gap" min={4} max={48} step={1} unit="px" value={values.gap} onChange={(value) => set("gap", value)} />
      <Slider label="Proximity" min={40} max={320} step={5} unit="px" value={values.proximity} onChange={(value) => set("proximity", value)} />
      <Slider label="Strength" min={0} max={2.5} step={0.05} value={values.strength} onChange={(value) => set("strength", value)} />
      <Slider label="Bounce" min={0} max={1} step={0.05} value={values.bounce} onChange={(value) => set("bounce", value)} />
      <Slider label="Swell" min={0} max={2} step={0.05} value={values.swell} onChange={(value) => set("swell", value)} />
      <Slider label="Glow" min={0} max={1.5} step={0.05} value={values.glow} onChange={(value) => set("glow", value)} />
    </CustomizeFrame>
  )
}
