"use client"

import { TiltedTiles } from "@/registry/mewo/ui/tilted-tiles"
import { Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  columns: 16,
  tilesPerColumn: 5,
  duration: 25,
  rotateX: 40,
  rotateY: 16,
  rotateZ: -20,
  perspective: 1600,
  planeWidth: 280,
  stagger: 20,
  rowGap: 8,
  columnGap: 8,
  borderRadius: 0,
  fadeTop: 22,
  saturation: 1,
  alternate: true,
  parallax: true,
  pauseOnHover: false,
}
export const DEMO_ONLY = [] as const

export default function TiltedTilesCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "TiltedTiles", item: "tilted-tiles", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={
        // the wall fills its parent, so the preview gives it a box, as the demo does
        <div className="h-[500px] w-full overflow-hidden rounded-lg border">
          <TiltedTiles {...values} />
        </div>
      }
    >
      <Slider label="Columns" min={2} max={24} step={1} value={values.columns} onChange={(value) => set("columns", value)} />
      <Slider label="Tiles per column" min={3} max={10} step={1} value={values.tilesPerColumn} onChange={(value) => set("tilesPerColumn", value)} />
      <Slider label="Duration" min={5} max={60} step={1} unit="s" value={values.duration} onChange={(value) => set("duration", value)} />
      <Slider label="Rotate X" min={0} max={75} step={1} unit="°" value={values.rotateX} onChange={(value) => set("rotateX", value)} />
      <Slider label="Rotate Y" min={-45} max={45} step={1} unit="°" value={values.rotateY} onChange={(value) => set("rotateY", value)} />
      <Slider label="Rotate Z" min={-60} max={60} step={1} unit="°" value={values.rotateZ} onChange={(value) => set("rotateZ", value)} />
      <Slider label="Perspective" min={400} max={2500} step={50} unit="px" value={values.perspective} onChange={(value) => set("perspective", value)} />
      <Slider label="Plane width" min={100} max={400} step={5} unit="%" value={values.planeWidth} onChange={(value) => set("planeWidth", value)} />
      <Slider label="Stagger" min={0} max={60} step={1} unit="%" value={values.stagger} onChange={(value) => set("stagger", value)} />
      <Slider label="Row gap" min={0} max={40} step={1} unit="px" value={values.rowGap} onChange={(value) => set("rowGap", value)} />
      <Slider label="Column gap" min={0} max={40} step={1} unit="px" value={values.columnGap} onChange={(value) => set("columnGap", value)} />
      <Slider label="Radius" min={0} max={32} step={1} unit="px" value={values.borderRadius} onChange={(value) => set("borderRadius", value)} />
      <Slider label="Top fade" min={0} max={60} step={1} unit="%" value={values.fadeTop} onChange={(value) => set("fadeTop", value)} />
      <Slider label="Saturation" min={0} max={2} step={0.05} value={values.saturation} onChange={(value) => set("saturation", value)} />
      <Switch label="Alternate" checked={values.alternate} onChange={(value) => set("alternate", value)} />
      <Switch label="Parallax" checked={values.parallax} onChange={(value) => set("parallax", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} onChange={(value) => set("pauseOnHover", value)} />
    </CustomizeFrame>
  )
}
