"use client"

import { NAMES_DUEL_CATS } from "@/components/demos/cat-pictures"
import { NamesDuel } from "@/registry/mewo/blocks/names-duel"
import { Input, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import { FramedPreview, useFramedValues } from "./framed"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { top: "First ruler", bottom: "Second ruler", length: 3.1 }
export const DEMO_ONLY = [] as const

const credit = (title: string, by: string) => ({ title, by, line: "A museum somewhere. Placeholder photograph.", href: "#" })

/** The two duels of the demo, scrolling inside their box; the first takes the values, the second keeps its names. */
export function Framed() {
  const values = useFramedValues(DEFAULTS)
  return (
    // the frame is the window here: the box fills it, its edges the frame's
    <div className="h-dvh w-full overflow-y-auto [container-type:inline-size]">
      <NamesDuel top={values.top} bottom={values.bottom} length={values.length} pictures={[{ ...NAMES_DUEL_CATS[0], credit: credit("A carved disc", "c. 2300 BCE") }]} />
      <NamesDuel
        top="Builder"
        bottom="Conqueror"
        length={values.length}
        pictures={[
          { ...NAMES_DUEL_CATS[1], credit: credit("A law stone", "c. 1750 BCE") },
          { ...NAMES_DUEL_CATS[2], credit: credit("A city gate", "c. 575 BCE") },
        ]}
      />
    </div>
  )
}

export default function NamesDuelCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "NamesDuel", item: "names-duel", block: true, props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<FramedPreview name="names-duel" values={values} run={run} className="h-[500px]" />}
    >
      <Input label="Top name" value={values.top} onChange={(value) => set("top", value)} />
      <Input label="Bottom name" value={values.bottom} onChange={(value) => set("bottom", value)} />
      <Slider label="Length" min={2} max={6} step={0.1} format={(value) => `${value} screens`} value={values.length} onChange={(value) => set("length", value)} />
    </CustomizeFrame>
  )
}
