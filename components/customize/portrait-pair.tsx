"use client"

import { ScrollBox } from "@/components/demos/scroll-box"
import { PortraitPair } from "@/registry/mewo/blocks/portrait-pair"
import { Input, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import { FramedPreview, useFramedValues } from "./framed"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  line: "A new capital was founded on the river.",
  text: "Scholars there translated old books, and painters illustrated new ones.",
  length: 7.8,
}
export const DEMO_ONLY = [] as const

/** The section scrolling inside its box, opening on the first line, as in the demo. */
export function Framed() {
  const values = useFramedValues(DEFAULTS)
  return (
    // the frame is the window here: the box fills it, its edges the frame's
    <ScrollBox start={0.2} className="h-dvh w-full overflow-y-auto [container-type:inline-size]">
      <PortraitPair line={values.line} text={values.text} length={values.length} />
    </ScrollBox>
  )
}

export default function PortraitPairCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "PortraitPair", item: "portrait-pair", block: true, props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<FramedPreview name="portrait-pair" values={values} run={run} className="h-[500px]" />}
    >
      <Input label="Line" value={values.line} onChange={(value) => set("line", value)} />
      <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
      <Slider label="Length" min={5} max={12} step={0.1} format={(value) => `${value} screens`} value={values.length} onChange={(value) => set("length", value)} />
    </CustomizeFrame>
  )
}
