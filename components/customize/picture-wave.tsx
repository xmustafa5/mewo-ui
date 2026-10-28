"use client"

import * as React from "react"
import { PictureWave, type PictureWaveOrientation, type PictureWaveProps, type PictureWaveState } from "@/registry/mewo/ui/picture-wave"
import { Input, Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { same, useCustomize } from "./use-customize"

export const DEFAULTS = { state: "field", cycle: true, orientation: "auto", lean: 1, float: true, first: "Between", second: "Rivers" }
export const DEMO_ONLY = ["cycle", "first", "second"] as const

const WORDS = ["Between", "Rivers"]
const STATE_OPTIONS = [
  { value: "field", label: "Field" },
  { value: "wave", label: "Wave" },
]
const ORIENTATION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "horizontal", label: "Across" },
  { value: "vertical", label: "Standing up" },
]
const OTHER: Record<PictureWaveState, PictureWaveState> = { field: "wave", wave: "field" }

/** The demo's rhythm: from the chosen state, the field gathers back into the wave after a while and bursts again. */
function WaveCycle({ state, cycle, ...props }: { state: PictureWaveState; cycle: boolean } & Omit<PictureWaveProps, "state">) {
  const [flipped, setFlipped] = React.useState(false)
  const [base, setBase] = React.useState(state)
  // a new state from the controls starts the rhythm over from there
  if (base !== state) {
    setBase(state)
    setFlipped(false)
  }
  const shown = cycle && flipped ? OTHER[state] : state
  React.useEffect(() => {
    if (!cycle) return
    const id = window.setTimeout(() => setFlipped((value) => !value), shown === "field" ? 9000 : 3000)
    return () => window.clearTimeout(id)
  }, [cycle, shown])
  return <PictureWave state={shown} {...props} />
}

export default function PictureWaveCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const words = [values.first, values.second].filter(Boolean)
  const computed = same(words, WORDS) ? {} : { words }
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "PictureWave", item: "picture-wave", props: changedProps(values, defaults, DEMO_ONLY, computed) }}
      preview={
        <div className="h-[500px] w-full overflow-hidden rounded-xl border">
          <WaveCycle state={values.state as PictureWaveState} cycle={values.cycle} orientation={values.orientation as PictureWaveOrientation} lean={values.lean} float={values.float} words={words} />
        </div>
      }
    >
      <Select label="State" options={STATE_OPTIONS} value={values.state} onChange={(value) => set("state", value)} />
      <Switch label="Cycle" checked={values.cycle} onChange={(value) => set("cycle", value)} />
      <Select label="Orientation" options={ORIENTATION_OPTIONS} value={values.orientation} onChange={(value) => set("orientation", value)} />
      <Slider label="Lean" min={0} max={3} step={0.1} format={(value) => `${value.toFixed(1)}×`} value={values.lean} onChange={(value) => set("lean", value)} />
      <Switch label="Idle drift" checked={values.float} onChange={(value) => set("float", value)} />
      <Input label="First word" value={values.first} onChange={(value) => set("first", value)} />
      <Input label="Second word" value={values.second} onChange={(value) => set("second", value)} />
    </CustomizeFrame>
  )
}
