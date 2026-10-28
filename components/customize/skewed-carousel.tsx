"use client"

import { SkewedCarousel } from "@/registry/mewo/ui/skewed-carousel"
import { Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  cardWidth: 200,
  rotation: 60,
  inactiveScale: 0.85,
  perspective: 800,
  borderRadius: 8,
  titleBlur: 2,
  speed: 1,
  autoplayDelay: 3000,
  showTitles: true,
  showControls: true,
  showDots: true,
  loop: false,
  autoplay: false,
  enableDrag: true,
}
export const DEMO_ONLY = [] as const

export default function SkewedCarouselCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "SkewedCarousel", item: "skewed-carousel", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<SkewedCarousel aria-label="Sample photographs" className="py-6" {...values} />}
    >
      <Slider label="Card width" min={120} max={320} step={10} unit="px" value={values.cardWidth} onChange={(value) => set("cardWidth", value)} />
      <Slider label="Rotation" min={0} max={90} step={5} unit="°" value={values.rotation} onChange={(value) => set("rotation", value)} />
      <Slider label="Inactive scale" min={0.5} max={1} step={0.05} value={values.inactiveScale} onChange={(value) => set("inactiveScale", value)} />
      <Slider label="Perspective" min={300} max={2000} step={50} unit="px" value={values.perspective} onChange={(value) => set("perspective", value)} />
      <Slider label="Radius" min={0} max={40} step={1} unit="px" value={values.borderRadius} onChange={(value) => set("borderRadius", value)} />
      <Slider label="Title blur" min={0} max={10} step={0.5} unit="px" value={values.titleBlur} onChange={(value) => set("titleBlur", value)} />
      <Slider label="Speed" min={0.2} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.speed} onChange={(value) => set("speed", value)} />
      <Switch label="Autoplay" checked={values.autoplay} onChange={(value) => set("autoplay", value)} />
      <Slider label="Autoplay delay" min={800} max={8000} step={200} format={(value) => `${value / 1000}s`} disabled={!values.autoplay} value={values.autoplayDelay} onChange={(value) => set("autoplayDelay", value)} />
      <Switch label="Loop" checked={values.loop} onChange={(value) => set("loop", value)} />
      <Switch label="Titles" checked={values.showTitles} onChange={(value) => set("showTitles", value)} />
      <Switch label="Controls" checked={values.showControls} onChange={(value) => set("showControls", value)} />
      <Switch label="Dots" checked={values.showDots} onChange={(value) => set("showDots", value)} />
      <Switch label="Drag" checked={values.enableDrag} onChange={(value) => set("enableDrag", value)} />
    </CustomizeFrame>
  )
}
