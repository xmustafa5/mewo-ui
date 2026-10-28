"use client"

import { ParallaxCarousel } from "@/registry/mewo/ui/parallax-carousel"
import { Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  imageWidth: 420,
  imageHeight: 560,
  gap: 32,
  borderRadius: 16,
  parallaxIntensity: 0.4,
  uvScale: 1,
  lerp: 0.08,
  wheelSensitivity: 1,
  dragSensitivity: 1.4,
  autoplaySpeed: 0,
  toneGamma: 2.2,
  loop: false,
  pauseOnHover: true,
  showProgress: true,
}
export const DEMO_ONLY = [] as const

export default function ParallaxCarouselCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "ParallaxCarousel", item: "parallax-carousel", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<ParallaxCarousel className="h-[600px]" {...values} />}
    >
      <Slider label="Image width" min={200} max={520} step={10} unit="px" value={values.imageWidth} onChange={(value) => set("imageWidth", value)} />
      <Slider label="Image height" min={260} max={600} step={10} unit="px" value={values.imageHeight} onChange={(value) => set("imageHeight", value)} />
      <Slider label="Gap" min={0} max={96} step={2} unit="px" value={values.gap} onChange={(value) => set("gap", value)} />
      <Slider label="Radius" min={0} max={48} step={1} unit="px" value={values.borderRadius} onChange={(value) => set("borderRadius", value)} />
      <Slider label="Parallax" min={0} max={1} step={0.01} value={values.parallaxIntensity} onChange={(value) => set("parallaxIntensity", value)} />
      <Slider label="UV scale" min={0.6} max={1} step={0.01} value={values.uvScale} onChange={(value) => set("uvScale", value)} />
      <Slider label="Lerp" min={0.01} max={0.3} step={0.01} value={values.lerp} onChange={(value) => set("lerp", value)} />
      <Slider label="Wheel" min={0.1} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.wheelSensitivity} onChange={(value) => set("wheelSensitivity", value)} />
      <Slider label="Drag" min={0.1} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.dragSensitivity} onChange={(value) => set("dragSensitivity", value)} />
      <Slider label="Autoplay" min={0} max={300} step={5} format={(value) => (value ? `${value} px/s` : "Off")} value={values.autoplaySpeed} onChange={(value) => set("autoplaySpeed", value)} />
      <Slider label="Tone gamma" min={1} max={2.6} step={0.1} value={values.toneGamma} onChange={(value) => set("toneGamma", value)} />
      <Switch label="Loop" checked={values.loop} onChange={(value) => set("loop", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} disabled={!values.autoplaySpeed} onChange={(value) => set("pauseOnHover", value)} />
      {/* the progress line is hidden in loop mode */}
      <Switch label="Progress" checked={values.showProgress} disabled={values.loop} onChange={(value) => set("showProgress", value)} />
    </CustomizeFrame>
  )
}
