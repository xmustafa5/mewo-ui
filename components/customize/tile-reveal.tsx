"use client"

import * as React from "react"
import { TileReveal, type TileRevealProps } from "@/registry/mewo/ui/tile-reveal"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { tiles: 12, columns: 3, gap: 28, tileRadius: 0, grayscale: true, direction: "alternate", stagger: 0.06, zoom: 2.05, scrollLength: 3, scrub: 0.08 }
export const DEMO_ONLY = ["tiles"] as const

// any image URLs work; these are placeholders
const IMAGES = Array.from({ length: 12 }, (_, index) => `https://picsum.photos/seed/mewo-tile-${index + 1}/480/480`)
const DIRECTION_OPTIONS = [
  { value: "alternate", label: "Alternate" },
  { value: "top", label: "From the top" },
  { value: "bottom", label: "From the bottom" },
]
const TEXT = "The grid comes together as you scroll, then clears the way for what you want to say."
const LINK_CLASS = "mt-5 inline-flex rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"

export default function TileRevealCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const images = React.useMemo(() => IMAGES.slice(0, values.tiles), [values.tiles])
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{
        name: "TileReveal",
        item: "tile-reveal",
        props: changedProps(values, defaults, DEMO_ONLY),
        children: `<p className="mx-auto max-w-xs text-sm text-muted-foreground">${TEXT}</p>\n<a href="#" className="${LINK_CLASS}">Get started</a>`,
      }}
      preview={
        // the stage pins to its nearest scroll container, so the preview scrolls inside this box
        <div key={values.tiles} className="h-[480px] w-full overflow-y-auto rounded-lg border">
          <TileReveal
            images={images}
            columns={values.columns}
            gap={values.gap}
            tileRadius={values.tileRadius}
            grayscale={values.grayscale}
            direction={values.direction as TileRevealProps["direction"]}
            stagger={values.stagger}
            zoom={values.zoom}
            scrollLength={values.scrollLength}
            scrub={values.scrub}
            headline={<h2 className="max-w-[11ch] text-4xl font-semibold tracking-tight sm:text-5xl">Every piece in its place</h2>}
          >
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">{TEXT}</p>
            <a href="#" className={LINK_CLASS}>
              Get started
            </a>
          </TileReveal>
        </div>
      }
    >
      <Slider label="Tiles" min={3} max={12} step={1} value={values.tiles} onChange={(value) => set("tiles", value, { replay: true })} />
      <Slider label="Columns" min={1} max={5} step={1} value={values.columns} onChange={(value) => set("columns", value)} />
      <Slider label="Gap" min={0} max={48} step={2} unit="px" value={values.gap} onChange={(value) => set("gap", value)} />
      <Slider label="Corners" min={0} max={32} step={2} unit="px" value={values.tileRadius} onChange={(value) => set("tileRadius", value)} />
      <Switch label="Grayscale" checked={values.grayscale} onChange={(value) => set("grayscale", value)} />
      <Select label="Direction" options={DIRECTION_OPTIONS} value={values.direction} onChange={(value) => set("direction", value)} />
      <Slider label="Stagger" min={0} max={0.3} step={0.01} value={values.stagger} onChange={(value) => set("stagger", value)} />
      <Slider label="Zoom" min={1.2} max={4} step={0.05} format={(value) => `${value}×`} value={values.zoom} onChange={(value) => set("zoom", value)} />
      <Slider label="Scroll length" min={1} max={5} step={0.5} format={(value) => `${value} vh`} value={values.scrollLength} onChange={(value) => set("scrollLength", value)} />
      <Slider label="Scrub" min={0} max={0.5} step={0.01} unit="s" value={values.scrub} onChange={(value) => set("scrub", value)} />
    </CustomizeFrame>
  )
}
