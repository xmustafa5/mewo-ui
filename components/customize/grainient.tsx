"use client"

import { Grainient, type GrainientType } from "@/registry/mewo/ui/grainient"
import { ColorList } from "./color-picker"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps, Primitive } from "./types"
import { changedProps } from "./usage"
import { serialize, useCustomize } from "./use-customize"

export const DEFAULTS = {
  preset: "ember",
  colors: ["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"],
  type: "linear",
  angle: 55,
  bands: 1,
  flow: 0.8,
  speed: 1,
  silk: 0.35,
  grainAmount: 0.08,
  saturation: 1,
  lightMode: false,
}
export const DEMO_ONLY = ["preset"] as const

// on a light page the ramp is lifted
const LIGHT = { lightMode: true }

// the Studio's presets: what each one sets over the defaults
const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
  ember: {},
  cobalt: { colors: ["#0b0c12", "#101a5a", "#1821fb", "#6b8cff", "#dfe6ff"], angle: 35 },
  ocean: { colors: ["#0b1020", "#0f2a4a", "#1d6fa5", "#5ec8f2", "#dff6ff"], angle: 120 },
  mint: { colors: ["#0a1410", "#0f3b2e", "#16a085", "#7ee8c1", "#e6fff5"], type: "radial" },
  mono: { colors: ["#0b0b0e", "#2a2a32", "#6b6b78", "#c9c9d2", "#f4f4f7"], saturation: 0, grainAmount: 0.14 },
}
const PRESET_OPTIONS = Object.keys(PRESETS)
const TYPE_OPTIONS = ["linear", "radial"]

export default function GrainientCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, setMany, reset, replay } = useCustomize(DEFAULTS, { light: LIGHT })
  const props = changedProps(values, defaults, DEMO_ONLY)
  const studio = new URLSearchParams({ bg: "grainient" })
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
      usage={{ name: "Grainient", item: "grainient", props }}
      preview={
        <div className="relative h-[500px] w-full overflow-hidden rounded-xl">
          <Grainient
            className="absolute inset-0"
            colors={values.colors}
            type={values.type as GrainientType}
            angle={values.angle}
            bands={values.bands}
            flow={values.flow}
            speed={values.speed}
            silk={values.silk}
            grainAmount={values.grainAmount}
            saturation={values.saturation}
            lightMode={values.lightMode}
          />
          <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Grainient</h2>
            <p className="mt-2 text-muted-foreground">Move the pointer to stir it. Click to swirl.</p>
          </div>
        </div>
      }
    >
      {/* a preset starts over from the defaults, as the Studio does, and settles in again */}
      <Select label="Preset" options={PRESET_OPTIONS} value={values.preset} onChange={(preset) => setMany({ ...defaults, ...PRESETS[preset], preset }, { replay: true })} />
      <ColorList label="Colors" colors={values.colors} min={2} max={8} onChange={(value) => set("colors", value)} />
      <Select label="Type" options={TYPE_OPTIONS} value={values.type} onChange={(value) => set("type", value)} />
      <Slider label="Angle" min={0} max={360} step={1} unit="°" value={values.angle} onChange={(value) => set("angle", value)} />
      <Slider label="Bands" min={1} max={6} step={1} value={values.bands} onChange={(value) => set("bands", value)} />
      <Slider label="Flow" min={0} max={2} step={0.05} value={values.flow} onChange={(value) => set("flow", value)} />
      <Slider label="Speed" min={0} max={3} step={0.05} value={values.speed} onChange={(value) => set("speed", value)} />
      <Slider label="Silk" min={0} max={1} step={0.01} value={values.silk} onChange={(value) => set("silk", value)} />
      <Slider label="Grain" min={0} max={0.3} step={0.01} value={values.grainAmount} onChange={(value) => set("grainAmount", value)} />
      <Slider label="Saturation" min={0} max={2} step={0.01} value={values.saturation} onChange={(value) => set("saturation", value)} />
      <Switch label="Light mode" checked={values.lightMode} onChange={(value) => set("lightMode", value)} />
    </CustomizeFrame>
  )
}
