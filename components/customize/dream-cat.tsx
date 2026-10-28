"use client"

import { DreamCat, type DreamCatEyes } from "@/registry/mewo/ui/dream-cat"
import { Color } from "./color-picker"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

/** An empty fur colour is the model's own blue, which the picker then shows. */
export const DEFAULTS = {
  color: "#000000",
  fogColor: "#c6c6c6",
  track: true,
  x: 0.84,
  y: 0.71,
  zoom: 2.15,
  fog: 0.5,
  swirl: 2.9,
  dissolve: 1,
  drift: 1.55,
  eyes: "rings",
  reach: 60,
  stretch: 2.3,
  gaze: 4,
  lean: 10,
  smoothing: 0.54,
  sheen: 1.8,
  exposure: 0.7,
}
export const DEMO_ONLY = [] as const

const MODEL_BLUE = "#0a2ed8"
const EYES_OPTIONS = ["rings", "plain"]

/** A hex colour read back from the address has lost its `#`. */
const withHash = (value: string) => (/^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value)
const percent = (value: number) => `${Math.round(value * 100)}%`

export default function DreamCatCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const color = withHash(values.color)
  const fogColor = withHash(values.fogColor)
  const props = changedProps(values, defaults, ["color", "fogColor"], {
    ...(color !== DEFAULTS.color ? { color } : {}),
    ...(fogColor !== DEFAULTS.fogColor ? { fogColor } : {}),
  })
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "DreamCat", item: "dream-cat", props }}
      preview={
        // the model is served from the site's public/models/, where the page's download note says to put it; a black
        // night behind the dream (on a page, the character shows whatever is behind it)
        <div className="relative h-[500px] w-full overflow-hidden rounded-xl bg-black">
          <DreamCat src="/models/mewo.glb" alt="The mewo cat reaching for the pointer in a dream" {...values} color={color} fogColor={fogColor} eyes={values.eyes as DreamCatEyes} />
        </div>
      }
    >
      <Color label="Fur colour" value={color || MODEL_BLUE} onChange={(value) => set("color", value)} />
      <Color label="Fog colour" value={fogColor} onChange={(value) => set("fogColor", value)} />
      <Select label="Eyes" options={EYES_OPTIONS} value={values.eyes} onChange={(value) => set("eyes", value)} />
      <Switch label="Track the pointer" checked={values.track} onChange={(value) => set("track", value)} />
      <Slider label="Position X" min={0} max={1} step={0.01} format={percent} value={values.x} onChange={(value) => set("x", value)} />
      <Slider label="Position Y" min={0} max={1} step={0.01} format={percent} value={values.y} onChange={(value) => set("y", value)} />
      <Slider label="Zoom" min={0.3} max={2.2} step={0.05} format={(value) => `${value.toFixed(2)}×`} value={values.zoom} onChange={(value) => set("zoom", value)} />
      <Slider label="Fog" min={0} max={1} step={0.01} format={percent} value={values.fog} onChange={(value) => set("fog", value)} />
      <Slider label="Swirl" min={0} max={3} step={0.05} value={values.swirl} onChange={(value) => set("swirl", value)} />
      <Slider label="Dissolve" min={0} max={1} step={0.01} format={percent} value={values.dissolve} onChange={(value) => set("dissolve", value)} />
      <Slider label="Drift" min={0} max={3} step={0.05} value={values.drift} onChange={(value) => set("drift", value)} />
      <Slider label="Reach" min={0} max={180} step={1} unit="°" disabled={!values.track} value={values.reach} onChange={(value) => set("reach", value)} />
      <Slider label="Stretch" min={1} max={10} step={0.1} format={(value) => `${value.toFixed(1)}×`} disabled={!values.track} value={values.stretch} onChange={(value) => set("stretch", value)} />
      <Slider label="Gaze" min={0} max={45} step={1} unit="°" disabled={!values.track} value={values.gaze} onChange={(value) => set("gaze", value)} />
      <Slider label="Lean" min={0} max={25} step={1} unit="°" disabled={!values.track} value={values.lean} onChange={(value) => set("lean", value)} />
      <Slider label="Smoothing" min={0} max={0.8} step={0.01} format={(value) => `${value.toFixed(2)} s`} disabled={!values.track} value={values.smoothing} onChange={(value) => set("smoothing", value)} />
      <Slider label="Sheen" min={0} max={2} step={0.05} value={values.sheen} onChange={(value) => set("sheen", value)} />
      <Slider label="Exposure" min={0.4} max={2} step={0.05} value={values.exposure} onChange={(value) => set("exposure", value)} />
    </CustomizeFrame>
  )
}
