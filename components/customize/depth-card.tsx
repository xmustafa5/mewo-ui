"use client"

import { DepthCard, type DepthCardProps } from "@/registry/mewo/ui/depth-card"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Reveal = NonNullable<DepthCardProps["revealAnimation"]>

export const DEFAULTS = { width: 240, height: 320, maxRotation: 20, maxTranslation: 20, staggerDelay: 75, revealAnimation: "slide" as Reveal, spotlight: true }
export const DEMO_ONLY = [] as const

const REVEAL_OPTIONS: Reveal[] = ["slide", "fade", "scale", "none"]

export default function DepthCardCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "DepthCard", item: "depth-card", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<DepthCard {...values} />}
    >
      <Slider label="Width" min={180} max={300} step={2} unit="px" value={values.width} onChange={(value) => set("width", value)} />
      <Slider label="Height" min={240} max={400} step={2} unit="px" value={values.height} onChange={(value) => set("height", value)} />
      <Slider label="Rotation" min={0} max={30} step={1} unit="°" value={values.maxRotation} onChange={(value) => set("maxRotation", value)} />
      <Slider label="Travel" min={0} max={30} step={1} unit="px" value={values.maxTranslation} onChange={(value) => set("maxTranslation", value)} />
      <Select label="Reveal" options={REVEAL_OPTIONS} value={values.revealAnimation} onChange={(value) => set("revealAnimation", value)} />
      {/* the text shows at once without a reveal, so there is nothing to stagger */}
      <Slider label="Stagger" min={0} max={500} step={5} unit="ms" disabled={values.revealAnimation === "none"} value={values.staggerDelay} onChange={(value) => set("staggerDelay", value)} />
      <Switch label="Spotlight" checked={values.spotlight} onChange={(value) => set("spotlight", value)} />
    </CustomizeFrame>
  )
}
