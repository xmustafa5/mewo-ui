"use client"

import { ZoomPicture } from "@/registry/mewo/ui/zoom-picture"
import { cn } from "@/lib/utils"
import { Input, Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { box: "wide", picture: 1, showText: true, text: "Who made it, and why it was buried, are not recorded.", alt: "" }
export const DEMO_ONLY = ["box", "picture", "showText", "text"] as const

// the box's shape picks the motion: wide like a laptop, about square like a tablet, tall like a phone
const WIDTHS: Record<string, string> = { wide: "w-full", square: "w-[520px] max-w-full", tall: "w-[280px] max-w-full" }
const BOX_OPTIONS = [
  { value: "wide", label: "Wide" },
  { value: "square", label: "About square" },
  { value: "tall", label: "Tall" },
]
const TEXT_CLASS = "max-w-[24ch] font-heading text-2xl leading-tight sm:text-4xl"
const srcOf = (picture: number) => `https://picsum.photos/seed/mewo-zoom-picture-${picture}/1000/1200`

export default function ZoomPictureCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const text = values.showText && values.text ? values.text : ""
  const computed = values.picture !== DEFAULTS.picture ? { src: srcOf(values.picture) } : {}
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{
        name: "ZoomPicture",
        item: "zoom-picture",
        props: changedProps(values, defaults, DEMO_ONLY, computed),
        children: text ? `<p className="${TEXT_CLASS}">${text}</p>` : undefined,
      }}
      preview={
        // the box scrolls by itself: the picture pins in it, zooms in, pans down through itself and zooms back out
        <div key={values.box} className={cn("h-[500px] overflow-y-auto rounded-xl border", WIDTHS[values.box])}>
          <ZoomPicture src={srcOf(values.picture)} alt={values.alt}>
            {text ? <p className={TEXT_CLASS}>{text}</p> : null}
          </ZoomPicture>
        </div>
      }
    >
      <Select label="Box" options={BOX_OPTIONS} value={values.box} onChange={(value) => set("box", value, { replay: true })} />
      <Slider label="Picture" min={1} max={9} step={1} format={(value) => `#${value}`} value={values.picture} onChange={(value) => set("picture", value)} />
      <Switch label="Show the text" checked={values.showText} onChange={(value) => set("showText", value)} />
      <Input label="Text" value={values.text} disabled={!values.showText} onChange={(value) => set("text", value)} />
      <Input label="Alt" value={values.alt} placeholder="Describe the picture" onChange={(value) => set("alt", value)} />
    </CustomizeFrame>
  )
}
