"use client"

import * as React from "react"
import { PictureCloud, type PictureCloudControls, type PictureCloudProps } from "@/registry/mewo/ui/picture-cloud"
import { Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { count: 1766, petals: 10, outlines: true, pictures: 0, scroll: 6 }
export const DEMO_ONLY = ["pictures", "scroll"] as const

const picturesOf = (count: number) => Array.from({ length: count }, (_, index) => `https://picsum.photos/seed/mewo-picture-cloud-${index + 1}/400/400`)

/** The demo's box: it scrolls by itself, and its scroll position drives the cloud through its whole sequence. */
function CloudBox({ scroll, ...props }: { scroll: number } & PictureCloudProps) {
  const cloud = React.useRef<PictureCloudControls>(null)
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const box = event.currentTarget
    const end = Math.max(1, box.scrollHeight - box.clientHeight)
    cloud.current?.setProgress(0.04 + 0.96 * (box.scrollTop / end))
  }
  return (
    // the sticky stage is as tall as the box whatever height the box is given: container units
    <div onScroll={onScroll} className="h-[min(70vh,640px)] w-full overflow-y-auto rounded-xl border bg-background [container-type:size]">
      <div style={{ height: `${scroll * 100}%` }}>
        <div className="sticky top-0 h-[100cqh]">
          <PictureCloud controlsRef={cloud} progress={0.04} {...props} />
        </div>
      </div>
    </div>
  )
}

export default function PictureCloudCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const images = values.pictures > 0 ? picturesOf(values.pictures) : undefined
  const computed = images ? { images } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "PictureCloud", item: "picture-cloud", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={<CloudBox key={values.scroll} scroll={values.scroll} images={images} count={values.count} petals={values.petals} outlines={values.outlines} />}
    >
      <Slider label="Tiles" min={300} max={3000} step={50} value={values.count} onChange={(value) => set("count", value)} />
      <Slider label="Petals" min={3} max={16} step={1} value={values.petals} onChange={(value) => set("petals", value)} />
      <Switch label="Outlines" checked={values.outlines} onChange={(value) => set("outlines", value)} />
      <Slider label="Pictures" min={0} max={8} step={1} format={(value) => (value ? `${value}` : "None")} value={values.pictures} onChange={(value) => set("pictures", value)} />
      {/* the runway's height sets the pace against the scroll; the box starts over at the top */}
      <Slider label="Scroll" min={3} max={12} step={1} format={(value) => `${value}× the box`} value={values.scroll} onChange={(value) => set("scroll", value, { replay: true })} />
    </CustomizeFrame>
  )
}
