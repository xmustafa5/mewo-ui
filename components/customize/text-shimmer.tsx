"use client"

import { TextShimmer } from "@/registry/mewo/ui/text-shimmer"
import { cn } from "@/lib/utils"
import { Input, Select, Slider } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { text: "Shimmering text", duration: 2, size: "medium" }
export const DEMO_ONLY = ["text", "size"] as const

const SIZES: Record<string, string> = { small: "text-2xl", medium: "text-4xl", large: "text-6xl" }
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
]

export default function TextShimmerCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "TextShimmer", item: "text-shimmer", props: changedProps(values, defaults, DEMO_ONLY), children: values.text }}
      preview={
        <TextShimmer duration={values.duration} className={cn("font-semibold tracking-tight", SIZES[values.size])}>
          {values.text || " "}
        </TextShimmer>
      }
    >
      <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
      <Slider label="Duration" min={0.5} max={6} step={0.1} unit="s" value={values.duration} onChange={(value) => set("duration", value)} />
      <Select label="Size" options={SIZE_OPTIONS} value={values.size} onChange={(value) => set("size", value)} />
    </CustomizeFrame>
  )
}
