"use client"

import { PrismCarousel } from "@/registry/mewo/ui/prism-carousel"
import { Color } from "./color-picker"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize, useIsLight } from "./use-customize"

/** An empty background is the piece's own, transparent: the page shows through. */
export const DEFAULTS = {
  preset: "prism",
  backgroundColor: "",
  aspect: 1.5,
  size: 0.62,
  neighborScale: 0.66,
  gap: 14,
  radius: 18,
  saturation: 0,
  dim: 0.2,
  sweep: 1,
  sweepDuration: 1.1,
  dispersion: 1,
  interval: 4.5,
  autoplay: true,
  loop: true,
  captions: true,
  controls: true,
  draggable: true,
  wheel: true,
  pauseOnHover: true,
  paused: false,
}
// a preset is the panel's own: a set of looks it writes into the real props
export const DEMO_ONLY = ["preset"] as const

type Look = Partial<Omit<typeof DEFAULTS, "preset" | "backgroundColor">>
const PRESETS: Record<string, Look> = {
  prism: {},
  vivid: { saturation: 1, dim: 0.15, sweep: 0.7, sweepDuration: 1 },
  cinema: { aspect: 2.1, size: 0.56, neighborScale: 0.7, dim: 0.35, sweepDuration: 1.3, dispersion: 0.8 },
  portrait: { aspect: 0.75, size: 0.74, neighborScale: 0.74 },
  quiet: { saturation: 0.25, dim: 0.25, sweep: 0, dispersion: 0 },
  spectrum: { sweep: 1.7, sweepDuration: 1.5, dispersion: 2 },
}
const PRESET_OPTIONS = Object.keys(PRESETS)

// the page's own colour, shown while the background is left transparent
const PAGE = { dark: "#0b0c12", light: "#fcfcfe" }
const withHash = (value: string) => (/^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value)

export default function PrismCarouselCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, setMany, reset, replay } = useCustomize(DEFAULTS)
  const light = useIsLight()
  const { preset, backgroundColor, ...look } = values
  const background = withHash(backgroundColor)
  const props = changedProps(values, defaults, [...DEMO_ONLY, "backgroundColor"], background ? { backgroundColor: background } : {})
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "PrismCarousel", item: "prism-carousel", props }}
      preview={
        // the carousel fills its parent, so the preview gives it a box, as the demo does
        <div className="h-[500px] w-full overflow-hidden rounded-xl">
          <PrismCarousel {...look} backgroundColor={background || undefined} />
        </div>
      }
    >
      <Select label="Preset" options={PRESET_OPTIONS} value={preset} onChange={(next) => setMany({ ...defaults, backgroundColor, ...PRESETS[next], preset: next })} />
      <Color label="Background" value={background || (light ? PAGE.light : PAGE.dark)} onChange={(value) => set("backgroundColor", value)} />
      <Slider label="Aspect" min={0.6} max={2.4} step={0.01} value={values.aspect} onChange={(value) => set("aspect", value)} />
      <Slider label="Size" min={0.35} max={0.9} step={0.01} value={values.size} onChange={(value) => set("size", value)} />
      <Slider label="Neighbour scale" min={0.4} max={1} step={0.01} value={values.neighborScale} onChange={(value) => set("neighborScale", value)} />
      <Slider label="Gap" min={0} max={40} step={1} unit="px" value={values.gap} onChange={(value) => set("gap", value)} />
      <Slider label="Radius" min={0} max={48} step={1} unit="px" value={values.radius} onChange={(value) => set("radius", value)} />
      <Slider label="Saturation" min={0} max={1} step={0.01} value={values.saturation} onChange={(value) => set("saturation", value)} />
      <Slider label="Dim" min={0} max={0.8} step={0.01} value={values.dim} onChange={(value) => set("dim", value)} />
      <Slider label="Sweep" min={0} max={2} step={0.05} value={values.sweep} onChange={(value) => set("sweep", value)} />
      <Slider label="Sweep duration" min={0.4} max={3} step={0.05} unit="s" value={values.sweepDuration} onChange={(value) => set("sweepDuration", value)} />
      <Slider label="Dispersion" min={0} max={3} step={0.05} value={values.dispersion} onChange={(value) => set("dispersion", value)} />
      <Switch label="Autoplay" checked={values.autoplay} onChange={(value) => set("autoplay", value)} />
      <Slider label="Interval" min={2} max={12} step={0.5} unit="s" disabled={!values.autoplay} value={values.interval} onChange={(value) => set("interval", value)} />
      <Switch label="Loop" checked={values.loop} onChange={(value) => set("loop", value)} />
      <Switch label="Captions" checked={values.captions} onChange={(value) => set("captions", value)} />
      <Switch label="Controls" checked={values.controls} onChange={(value) => set("controls", value)} />
      <Switch label="Draggable" checked={values.draggable} onChange={(value) => set("draggable", value)} />
      <Switch label="Wheel" checked={values.wheel} onChange={(value) => set("wheel", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} disabled={!values.autoplay} onChange={(value) => set("pauseOnHover", value)} />
      <Switch label="Paused" checked={values.paused} disabled={!values.autoplay} onChange={(value) => set("paused", value)} />
    </CustomizeFrame>
  )
}
