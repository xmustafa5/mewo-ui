"use client"

import { FeaturesSpotlight } from "@/registry/mewo/blocks/features-spotlight"
import { Input } from "./controls"
import { CustomizeFrame } from "./frame"
import { FramedPreview, useFramedValues } from "./framed"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { eyebrow: "Why mewo", title: "Everything you need to ship motion" }
export const DEMO_ONLY = [] as const

export function Framed() {
  const values = useFramedValues(DEFAULTS)
  return <FeaturesSpotlight eyebrow={values.eyebrow} title={values.title} />
}

export default function FeaturesSpotlightCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      stageClassName="p-3 sm:p-4"
      usage={{ name: "FeaturesSpotlight", item: "features-spotlight", block: true, props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={<FramedPreview name="features-spotlight" values={values} run={run} />}
    >
      <Input label="Eyebrow" value={values.eyebrow} onChange={(value) => set("eyebrow", value)} />
      <Input label="Title" value={values.title} onChange={(value) => set("title", value)} />
    </CustomizeFrame>
  )
}
