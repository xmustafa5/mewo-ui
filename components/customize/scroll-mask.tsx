"use client"

import { ScrollMask, type ScrollMaskVariant } from "@/registry/mewo/ui/scroll-mask"
import { Input, Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { variant: "iris", word: "SCROLL", columns: 9, angle: 108, feather: 14, stagger: 0.55, zoom: 1.14, overlay: 0, radius: 18, scrollLength: 1.7 }
export const DEMO_ONLY = [] as const

const VARIANT_OPTIONS = [
  { value: "iris", label: "Iris" },
  { value: "wipe", label: "Wipe" },
  { value: "curtain", label: "Curtain" },
  { value: "slats", label: "Slats" },
  { value: "grid", label: "Grid" },
  { value: "type", label: "Type" },
]
const LABEL_CLASS = "text-[10px] tracking-[0.32em] uppercase opacity-70"
const TITLE_CLASS = "mt-2 text-4xl font-medium tracking-tight capitalize"

export default function ScrollMaskCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  // slats and grid are the pieced variants: the piece count and the stagger only apply to them
  const pieced = values.variant === "slats" || values.variant === "grid"
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{
        name: "ScrollMask",
        item: "scroll-mask",
        props: changedProps(values, defaults, DEMO_ONLY),
        children: `<div className="px-6 text-center text-white">\n  <p className="${LABEL_CLASS}">Variant</p>\n  <h3 className="${TITLE_CLASS}">${values.variant}</h3>\n</div>`,
      }}
      preview={
        // the frame pins to its nearest scroll container, so the preview scrolls inside this box
        <div className="h-[480px] w-full overflow-y-auto rounded-lg border">
          <ScrollMask
            variant={values.variant as ScrollMaskVariant}
            word={values.word}
            columns={values.columns}
            angle={values.angle}
            feather={values.feather}
            stagger={values.stagger}
            zoom={values.zoom}
            overlay={values.overlay}
            radius={values.radius}
            scrollLength={values.scrollLength}
            alt="Landscape photograph"
          >
            <div className="px-6 text-center text-white">
              <p className={LABEL_CLASS}>Variant</p>
              <h3 className={TITLE_CLASS}>{values.variant}</h3>
            </div>
          </ScrollMask>
        </div>
      }
    >
      <Select label="Variant" options={VARIANT_OPTIONS} value={values.variant} onChange={(value) => set("variant", value)} />
      <Input label="Word" value={values.word} disabled={values.variant !== "type"} onChange={(value) => set("word", value)} />
      <Slider label="Columns" min={2} max={16} step={1} disabled={!pieced} value={values.columns} onChange={(value) => set("columns", value)} />
      <Slider label="Stagger" min={0} max={0.9} step={0.05} format={(value) => `${Math.round(value * 100)}%`} disabled={!pieced} value={values.stagger} onChange={(value) => set("stagger", value)} />
      <Slider label="Angle" min={0} max={360} step={2} unit="°" disabled={values.variant !== "wipe"} value={values.angle} onChange={(value) => set("angle", value)} />
      <Slider label="Feather" min={0} max={40} step={1} unit="%" value={values.feather} onChange={(value) => set("feather", value)} />
      <Slider label="Zoom" min={1} max={1.6} step={0.02} format={(value) => `${value}×`} value={values.zoom} onChange={(value) => set("zoom", value)} />
      <Slider label="Overlay" min={0} max={0.8} step={0.05} format={(value) => `${Math.round(value * 100)}%`} value={values.overlay} onChange={(value) => set("overlay", value)} />
      <Slider label="Radius" min={0} max={48} step={2} unit="px" value={values.radius} onChange={(value) => set("radius", value)} />
      <Slider label="Scroll length" min={0.5} max={3} step={0.1} format={(value) => `${value} vh`} value={values.scrollLength} onChange={(value) => set("scrollLength", value)} />
    </CustomizeFrame>
  )
}
