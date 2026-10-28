"use client"

import { PictureOrbit } from "@/registry/mewo/ui/picture-orbit"
import { Input, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

/** An empty text keeps the piece's own two-line title in the middle. */
export const DEFAULTS = { length: 4.6, lean: 1, float: true, title: true, text: "" }
export const DEMO_ONLY = ["title", "text"] as const

const TEXT_CLASS = "max-w-[18ch] font-heading text-4xl leading-tight"

export default function PictureOrbitCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  // nothing in the middle takes an explicit null: left out, the piece shows its own title
  const children = !values.title ? null : values.text ? <p className={TEXT_CLASS}>{values.text}</p> : undefined
  const usageChildren = !values.title ? "{null}" : values.text ? `<p className="${TEXT_CLASS}">${values.text}</p>` : undefined
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "PictureOrbit", item: "picture-orbit", props: changedProps(values, defaults, DEMO_ONLY), children: usageChildren }}
      preview={
        // the box scrolls by itself: the stage pins in it and the cards rise around the title
        <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background">
          <PictureOrbit length={values.length} lean={values.lean} float={values.float}>
            {children}
          </PictureOrbit>
        </div>
      }
    >
      <Slider label="Pinned for" min={1} max={12} step={0.1} format={(value) => `${value.toFixed(1)} screens`} value={values.length} onChange={(value) => set("length", value)} />
      <Slider label="Lean" min={0} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.lean} onChange={(value) => set("lean", value)} />
      <Switch label="Idle drift" checked={values.float} onChange={(value) => set("float", value)} />
      <Switch label="Show the title" checked={values.title} onChange={(value) => set("title", value)} />
      <Input label="Text" value={values.text} placeholder="The piece's own title" disabled={!values.title} onChange={(value) => set("text", value)} />
    </CustomizeFrame>
  )
}
