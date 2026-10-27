"use client"

import { AlbumRail } from "@/registry/mewo/ui/album-rail"
import { Color } from "./color-picker"
import { Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { size: 280, visible: 3, turn: 22, fan: 6, loop: true, autoplay: 4000, pauseOnHover: true, showCaption: true, showControls: true, accent: "#b19eef" }
export const DEMO_ONLY = [] as const

export default function AlbumRailCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  // the autoplay slider's 0 is the prop's `false`
  const computed = values.autoplay === 0 ? { autoplay: false } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "AlbumRail", item: "album-rail", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        <AlbumRail
          className="py-6"
          size={values.size}
          visible={values.visible}
          turn={values.turn}
          fan={values.fan}
          loop={values.loop}
          autoplay={values.autoplay || false}
          pauseOnHover={values.pauseOnHover}
          showCaption={values.showCaption}
          showControls={values.showControls}
          accent={values.accent}
        />
      }
    >
      <Slider label="Size" min={160} max={400} step={10} unit="px" value={values.size} onChange={(value) => set("size", value)} />
      <Slider label="Per side" min={1} max={5} step={1} value={values.visible} onChange={(value) => set("visible", value)} />
      <Slider label="Turn" min={0} max={60} step={1} unit="°" value={values.turn} onChange={(value) => set("turn", value)} />
      <Slider label="Fan" min={0} max={15} step={0.5} unit="°" value={values.fan} onChange={(value) => set("fan", value)} />
      <Slider label="Autoplay" min={0} max={10000} step={500} format={(value) => (value ? `${value / 1000}s` : "Off")} value={values.autoplay} onChange={(value) => set("autoplay", value)} />
      <Switch label="Loop" checked={values.loop} onChange={(value) => set("loop", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} onChange={(value) => set("pauseOnHover", value)} />
      <Switch label="Caption" checked={values.showCaption} onChange={(value) => set("showCaption", value)} />
      <Switch label="Controls" checked={values.showControls} onChange={(value) => set("showControls", value)} />
      <Color label="Accent" value={values.accent} onChange={(value) => set("accent", value)} />
    </CustomizeFrame>
  )
}
