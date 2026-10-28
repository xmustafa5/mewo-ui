"use client"

import { AuroraBackground } from "@/registry/mewo/ui/aurora-background"
import { cn } from "@/lib/utils"
import { Input, Select, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { showRadialMask: true, height: "medium", title: "Aurora", text: "A backdrop for heroes and section headers." }
export const DEMO_ONLY = ["height", "title", "text"] as const

// the demo's box: the height travels as a className in the usage
const HEIGHTS: Record<string, string> = { short: "min-h-[240px]", medium: "min-h-[320px]", tall: "min-h-[440px]" }
const HEIGHT_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "tall", label: "Tall" },
]
const TITLE_CLASS = "text-3xl font-bold tracking-tight"
const TEXT_CLASS = "mt-2 text-muted-foreground"

export default function AuroraBackgroundCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const className = cn(HEIGHTS[values.height], "w-full rounded-lg")
  const computed = values.height !== DEFAULTS.height ? { className } : {}
  const children = [values.title && `<h2 className="${TITLE_CLASS}">${values.title}</h2>`, values.text && `<p className="${TEXT_CLASS}">${values.text}</p>`].filter(Boolean).join("\n")
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "AuroraBackground", item: "aurora-background", props: changedProps(values, defaults, DEMO_ONLY, computed), children: children || undefined }}
      preview={
        <AuroraBackground showRadialMask={values.showRadialMask} className={className}>
          {values.title ? <h2 className={TITLE_CLASS}>{values.title}</h2> : null}
          {values.text ? <p className={TEXT_CLASS}>{values.text}</p> : null}
        </AuroraBackground>
      }
    >
      <Switch label="Radial mask" checked={values.showRadialMask} onChange={(value) => set("showRadialMask", value)} />
      <Select label="Height" options={HEIGHT_OPTIONS} value={values.height} onChange={(value) => set("height", value)} />
      <Input label="Title" value={values.title} onChange={(value) => set("title", value)} />
      <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
    </CustomizeFrame>
  )
}
