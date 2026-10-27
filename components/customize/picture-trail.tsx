"use client"

import { PictureTrail, type PictureTrailProps } from "@/registry/mewo/ui/picture-trail"
import { Input, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { top: "Conqueror", bottom: "Last ruler", count: 6, picture: 1 }
export const DEMO_ONLY = ["count", "picture"] as const

const HOLDERS = ["First dynasty", "Second dynasty", "Third dynasty", "Fourth dynasty", "Fifth dynasty", "Sixth dynasty"]
const CREDIT = { title: "The siege", by: "c. 1258 CE", line: "A museum somewhere. Placeholder photograph.", href: "#" }
const srcOf = (picture: number) => `https://picsum.photos/seed/mewo-picture-trail-${picture}/1330/1478`

export default function PictureTrailCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const holders = HOLDERS.slice(0, values.count)
  // picture 1 is the piece's own; another one travels as the image prop, with the same credit
  const image: PictureTrailProps["image"] = values.picture !== DEFAULTS.picture ? { src: srcOf(values.picture), credit: CREDIT } : undefined
  const computed = { ...(values.count !== DEFAULTS.count ? { holders } : {}), ...(image ? { image } : {}) }
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "PictureTrail", item: "picture-trail", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        // the stage pins to its nearest scroll container, so the preview scrolls inside this box
        <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
          <PictureTrail top={values.top} bottom={values.bottom} holders={holders} image={image} />
        </div>
      }
    >
      {/* the names are measured when the stage is set up, so a new name plays from the start */}
      <Input label="First name" value={values.top} onChange={(value) => set("top", value, { replay: true })} />
      <Input label="Last name" value={values.bottom} onChange={(value) => set("bottom", value, { replay: true })} />
      <Slider label="Holders" min={1} max={HOLDERS.length} step={1} value={values.count} onChange={(value) => set("count", value)} />
      <Slider label="Picture" min={1} max={9} step={1} format={(value) => `#${value}`} value={values.picture} onChange={(value) => set("picture", value)} />
    </CustomizeFrame>
  )
}
