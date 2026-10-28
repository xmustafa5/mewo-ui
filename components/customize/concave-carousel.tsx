"use client"

import { ConcaveCarousel, type ConcaveCarouselProps } from "@/registry/mewo/ui/concave-carousel"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Autoplay = NonNullable<ConcaveCarouselProps["autoplay"]>

export const DEFAULTS = {
  autoplay: "drift" as Autoplay,
  aspect: 1.25,
  size: 0.46,
  curvature: 0.72,
  distance: 4,
  tilt: 0,
  gap: 16,
  radius: 14,
  reflection: 0.06,
  dim: 0.35,
  speed: 0.16,
  interval: 4,
  inertia: 0.5,
  snap: true,
  pauseOnHover: true,
  draggable: true,
  wheel: true,
  captions: true,
  controls: true,
  paused: false,
}
export const DEMO_ONLY = [] as const

const AUTOPLAY_OPTIONS: Autoplay[] = ["drift", "step", "off"]

export default function ConcaveCarouselCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const moving = values.autoplay !== "off"
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "ConcaveCarousel", item: "concave-carousel", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<ConcaveCarousel className="h-[560px]" {...values} />}
    >
      <Select label="Autoplay" options={AUTOPLAY_OPTIONS} value={values.autoplay} onChange={(value) => set("autoplay", value)} />
      <Slider label="Aspect" min={0.6} max={2} step={0.05} value={values.aspect} onChange={(value) => set("aspect", value)} />
      <Slider label="Size" min={0.2} max={0.8} step={0.01} value={values.size} onChange={(value) => set("size", value)} />
      <Slider label="Curvature" min={0} max={1} step={0.01} value={values.curvature} onChange={(value) => set("curvature", value)} />
      <Slider label="Distance" min={1.5} max={10} step={0.1} value={values.distance} onChange={(value) => set("distance", value)} />
      <Slider label="Tilt" min={-20} max={20} step={0.5} unit="°" value={values.tilt} onChange={(value) => set("tilt", value)} />
      <Slider label="Gap" min={0} max={60} step={1} unit="px" value={values.gap} onChange={(value) => set("gap", value)} />
      <Slider label="Radius" min={0} max={40} step={1} unit="px" value={values.radius} onChange={(value) => set("radius", value)} />
      <Slider label="Reflection" min={0} max={0.4} step={0.01} value={values.reflection} onChange={(value) => set("reflection", value)} />
      <Slider label="Dim" min={0} max={1} step={0.01} value={values.dim} onChange={(value) => set("dim", value)} />
      <Slider label="Speed" min={-1} max={1} step={0.01} disabled={!moving} value={values.speed} onChange={(value) => set("speed", value)} />
      <Slider label="Interval" min={1} max={10} step={0.5} unit="s" disabled={values.autoplay !== "step"} value={values.interval} onChange={(value) => set("interval", value)} />
      <Slider label="Inertia" min={0} max={1} step={0.05} value={values.inertia} onChange={(value) => set("inertia", value)} />
      <Switch label="Snap" checked={values.snap} onChange={(value) => set("snap", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} disabled={!moving} onChange={(value) => set("pauseOnHover", value)} />
      <Switch label="Draggable" checked={values.draggable} onChange={(value) => set("draggable", value)} />
      <Switch label="Wheel" checked={values.wheel} onChange={(value) => set("wheel", value)} />
      <Switch label="Captions" checked={values.captions} onChange={(value) => set("captions", value)} />
      <Switch label="Controls" checked={values.controls} onChange={(value) => set("controls", value)} />
      <Switch label="Paused" checked={values.paused} disabled={!moving} onChange={(value) => set("paused", value)} />
    </CustomizeFrame>
  )
}
