"use client"

import { GradientCarousel } from "@/registry/mewo/ui/gradient-carousel"
import { Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { maxRotationDegrees: 28, maxDepthPx: 140, minScale: 0.92, cardGap: 28, cardAspectRatio: 0.8, frictionFactor: 0.9, backgroundBlur: 24, gradientSize: 0.65, gradientIntensity: 0.7, initialIndex: 0 }
export const DEMO_ONLY = [] as const

// the demo's cards: any image URLs work, served with CORS headers so the backdrop can read their colours
const IMAGES = Array.from({ length: 8 }, (_, index) => `https://picsum.photos/seed/mewo-carousel-${index + 1}/480/600`)
const percent = (value: number) => `${Math.round(value * 100)}%`
const twoPlaces = (value: number) => value.toFixed(2)

export default function GradientCarouselCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "GradientCarousel", item: "gradient-carousel", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={
        <GradientCarousel
          images={IMAGES}
          aria-label="Sample photographs"
          className="h-[420px] rounded-lg"
          maxRotationDegrees={values.maxRotationDegrees}
          maxDepthPx={values.maxDepthPx}
          minScale={values.minScale}
          cardGap={values.cardGap}
          cardAspectRatio={values.cardAspectRatio}
          frictionFactor={values.frictionFactor}
          backgroundBlur={values.backgroundBlur}
          gradientSize={values.gradientSize}
          gradientIntensity={values.gradientIntensity}
          initialIndex={values.initialIndex}
        />
      }
    >
      <Slider label="Rotation" min={0} max={60} step={1} unit="°" value={values.maxRotationDegrees} onChange={(value) => set("maxRotationDegrees", value)} />
      <Slider label="Depth" min={0} max={300} step={10} unit="px" value={values.maxDepthPx} onChange={(value) => set("maxDepthPx", value)} />
      <Slider label="Edge scale" min={0.5} max={1} step={0.01} format={twoPlaces} value={values.minScale} onChange={(value) => set("minScale", value)} />
      <Slider label="Gap" min={0} max={80} step={2} unit="px" value={values.cardGap} onChange={(value) => set("cardGap", value)} />
      <Slider label="Card shape" min={0.5} max={1.5} step={0.05} format={twoPlaces} value={values.cardAspectRatio} onChange={(value) => set("cardAspectRatio", value)} />
      <Slider label="Friction" min={0.5} max={0.99} step={0.01} format={twoPlaces} value={values.frictionFactor} onChange={(value) => set("frictionFactor", value)} />
      <Slider label="Blur" min={0} max={60} step={1} unit="px" value={values.backgroundBlur} onChange={(value) => set("backgroundBlur", value)} />
      <Slider label="Glow size" min={0} max={1} step={0.05} format={percent} value={values.gradientSize} onChange={(value) => set("gradientSize", value)} />
      <Slider label="Glow" min={0} max={1} step={0.05} format={percent} value={values.gradientIntensity} onChange={(value) => set("gradientIntensity", value)} />
      {/* the carousel keeps where it was turned to across prop changes, so a new start card only shows from a fresh mount */}
      <Slider label="Start card" min={0} max={IMAGES.length - 1} step={1} value={values.initialIndex} onChange={(value) => set("initialIndex", value, { replay: true })} />
    </CustomizeFrame>
  )
}
