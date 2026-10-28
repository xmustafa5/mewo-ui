"use client"

import { NamesDuel } from "@/registry/mewo/blocks/names-duel"
import { Input, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import { FramedPreview, useFramedValues } from "./framed"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { top: "First ruler", bottom: "Second ruler", length: 3.1 }
export const DEMO_ONLY = [] as const

const pic = (n: number, w: number, h: number) => `https://picsum.photos/seed/mewo-names-duel-${n}/${w}/${h}`
const credit = (title: string, by: string) => ({ title, by, line: "A museum somewhere. Placeholder photograph.", href: "#" })

/** The two duels of the demo, scrolling inside their box; the first takes the values, the second keeps its names. */
export function Framed() {
  const values = useFramedValues(DEFAULTS)
  return (
    <div className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
      <NamesDuel top={values.top} bottom={values.bottom} length={values.length} pictures={[{ src: pic(1, 1000, 978), ratio: 1000 / 978, credit: credit("A carved disc", "c. 2300 BCE") }]} />
      <NamesDuel
        top="Builder"
        bottom="Conqueror"
        length={values.length}
        pictures={[
          { src: pic(2, 760, 1000), ratio: 760 / 1000, credit: credit("A law stone", "c. 1750 BCE") },
          { src: pic(3, 960, 1000), ratio: 960 / 1000, credit: credit("A city gate", "c. 575 BCE") },
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
      preview={<FramedPreview name="names-duel" values={values} run={run} />}
    >
      <Input label="Top name" value={values.top} onChange={(value) => set("top", value)} />
      <Input label="Bottom name" value={values.bottom} onChange={(value) => set("bottom", value)} />
      <Slider label="Length" min={2} max={6} step={0.1} format={(value) => `${value} screens`} value={values.length} onChange={(value) => set("length", value)} />
    </CustomizeFrame>
  )
}
