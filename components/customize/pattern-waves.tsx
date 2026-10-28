"use client"

import { PatternWaves, type PatternWavesPattern, type PatternWavesPreset, type PatternWavesWave } from "@/registry/mewo/ui/pattern-waves"
import { Color } from "./color-picker"
import { Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps, Primitive } from "./types"
import { changedProps } from "./usage"
import { same, serialize, useCustomize, useIsLight } from "./use-customize"

/** The look's defaults are the "silk" preset's. An empty background means the page colour, which the demo passes. */
export const DEFAULTS = { preset: "silk", pattern: "dot", wave: "silk", spacing: 9, markSize: 0.95, depth: 0.95, speed: 0.35, direction: 20, color: "#ffffff", backgroundColor: "" }
export const DEMO_ONLY = [] as const

// on a light page the marks are ink
const LIGHT = { color: "#18181b" }
const PAGE = { dark: "#0b0c12", light: "#fcfcfe" }

// What each preset sets on the controlled props. The piece carries the rest of a preset (its light, shine, contrast
// and scale) itself, so a control still at the preset's value leaves that prop to the preset.
type Look = { pattern: PatternWavesPattern; wave: PatternWavesWave; spacing: number; markSize: number; depth: number; speed: number; direction: number }
const LOOKS: Record<string, Look> = {
  silk: { pattern: "dot", wave: "silk", spacing: 9, markSize: 0.95, depth: 0.95, speed: 0.35, direction: 20 },
  ocean: { pattern: "dot", wave: "swell", spacing: 10, markSize: 0.9, depth: 0.42, speed: 0.5, direction: 100 },
  pond: { pattern: "dot", wave: "ripple", spacing: 10, markSize: 0.9, depth: 0.55, speed: 0.5, direction: 35 },
  lines: { pattern: "line", wave: "silk", spacing: 12, markSize: 0.42, depth: 0.9, speed: 0.3, direction: 20 },
  terminal: { pattern: "glyph", wave: "ripple", spacing: 13, markSize: 0.95, depth: 0.75, speed: 0.3, direction: 200 },
  mesh: { pattern: "plus", wave: "silk", spacing: 14, markSize: 0.8, depth: 0.95, speed: 0.4, direction: 325 },
}
const LOOK_KEYS = Object.keys(LOOKS.silk) as (keyof Look)[]
const PRESET_OPTIONS = Object.keys(LOOKS)
const PATTERN_OPTIONS = ["dot", "square", "plus", "line", "glyph"]
const WAVE_OPTIONS = ["silk", "swell", "ripple"]

/** A hex colour read back from the address has lost its `#`. */
const withHash = (value: string) => (/^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value)

export default function PatternWavesCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, setMany, reset, replay } = useCustomize(DEFAULTS, { light: LIGHT })
  const light = useIsLight()
  const look = LOOKS[values.preset] ?? LOOKS.silk
  const overrides: Partial<Look> = {}
  for (const key of LOOK_KEYS) if (!same(values[key], look[key])) (overrides as Record<string, Primitive>)[key] = values[key]
  const background = withHash(values.backgroundColor)
  const props = changedProps(values, defaults, LOOK_KEYS, { ...overrides, ...(background ? { backgroundColor: background } : {}) })
  // the Studio layers the same way: the preset, then the props that differ from it
  const studio = new URLSearchParams({ bg: "pattern-waves" })
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
      usage={{ name: "PatternWaves", item: "pattern-waves", props }}
      preview={
        <div className="relative h-80 w-full overflow-hidden rounded-xl">
          <PatternWaves className="absolute inset-0" preset={values.preset as PatternWavesPreset} {...overrides} color={values.color} backgroundColor={background || (light ? PAGE.light : PAGE.dark)} />
          <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Pattern Waves</h2>
            <p className="mt-2 text-muted-foreground">Move the pointer. Click for a ripple.</p>
          </div>
        </div>
      }
    >
      {/* a preset starts over from the defaults, as the Studio does, and rises in again */}
      <Select label="Preset" options={PRESET_OPTIONS} value={values.preset} onChange={(preset) => setMany({ ...defaults, ...LOOKS[preset], preset }, { replay: true })} />
      <Select label="Pattern" options={PATTERN_OPTIONS} value={values.pattern} onChange={(value) => set("pattern", value)} />
      <Select label="Wave" options={WAVE_OPTIONS} value={values.wave} onChange={(value) => set("wave", value)} />
      <Color label="Color" value={values.color} onChange={(value) => set("color", value)} />
      <Color label="Background" value={background || (light ? PAGE.light : PAGE.dark)} onChange={(value) => set("backgroundColor", value)} />
      <Slider label="Spacing" min={5} max={30} step={1} unit="px" value={values.spacing} onChange={(value) => set("spacing", value)} />
      <Slider label="Mark size" min={0.3} max={1} step={0.05} value={values.markSize} onChange={(value) => set("markSize", value)} />
      <Slider label="Depth" min={0} max={1.5} step={0.05} value={values.depth} onChange={(value) => set("depth", value)} />
      <Slider label="Speed" min={0} max={2} step={0.05} value={values.speed} onChange={(value) => set("speed", value)} />
      <Slider label="Direction" min={0} max={360} step={1} unit="°" value={values.direction} onChange={(value) => set("direction", value)} />
    </CustomizeFrame>
  )
}
