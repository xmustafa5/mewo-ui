"use client"

import * as React from "react"
import { RotateCcw } from "lucide-react"
import { Input, Select, Slider } from "@/components/customize/controls"
import { UsageBlock } from "@/components/customize/frame"
import { changedProps } from "@/components/customize/usage"
import { stageClass } from "@/components/site/component-preview"
import { cn } from "@/lib/utils"
import { TextShimmer } from "@/registry/mewo/ui/text-shimmer"

type Size = "small" | "medium" | "large"
type Values = { text: string; duration: number; size: Size }

// Text Shimmer's own panel, with its state held here instead of in the address.
const DEFAULTS: Values = { text: "Shimmering text", duration: 2, size: "medium" }
const DEMO_ONLY = ["text", "size"] as const
const SIZES: Record<Size, string> = { small: "text-2xl", medium: "text-4xl", large: "text-6xl" }
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const

const KEYS = Object.keys(DEFAULTS) as (keyof Values)[]

/**
 * The Customize panel as it sits on a component page, working: Text Shimmer on a stage, three control rows under
 * it, and the usage snippet that follows the values. The state is local to the page here; on a component page it
 * lives in the address, so a customised look is a link.
 */
export function CustomizeDemo() {
  const [values, setValues] = React.useState<Values>(DEFAULTS)
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((current) => ({ ...current, [key]: value }))
  const changed = KEYS.some((key) => values[key] !== DEFAULTS[key])

  return (
    <div data-slot="customize-demo" className="rounded-3xl border bg-card/50 p-1.5 shadow-2xl shadow-black/10">
      <div className={cn(stageClass, "flex min-h-52 items-center justify-center p-8 text-center")}>
        <TextShimmer duration={values.duration} className={cn("font-semibold tracking-tight", SIZES[values.size])}>
          {values.text || " "}
        </TextShimmer>
      </div>
      <section aria-labelledby="home-customize-heading" className="@container mt-1.5 rounded-2xl border bg-muted/50 p-1">
        <div className="flex min-h-11.5 items-center justify-between gap-4 py-2 pr-2 pl-3.5">
          <h3 id="home-customize-heading" className="text-sm font-semibold tracking-[-0.01em]">
            Customize
          </h3>
          <button
            type="button"
            onClick={() => setValues(DEFAULTS)}
            disabled={!changed}
            aria-hidden={!changed}
            tabIndex={changed ? 0 : -1}
            className={cn(
              "inline-flex h-7.5 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color,opacity,transform] duration-150 hover:bg-background hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring/60",
              !changed && "pointer-events-none invisible opacity-0"
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 rounded-[calc(var(--radius-2xl)_-_5px)] border bg-background p-3 @[26rem]:grid-cols-2 @[40rem]:grid-cols-3 [&>*:not([data-control])]:col-span-full">
          <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
          <Slider label="Duration" min={0.5} max={6} step={0.1} unit="s" value={values.duration} onChange={(value) => set("duration", value)} />
          <Select label="Size" options={SIZE_OPTIONS} value={values.size} onChange={(value) => set("size", value)} />
        </div>
      </section>
      <div className="mt-1.5">
        <UsageBlock
          usage={{ name: "TextShimmer", item: "text-shimmer", props: changedProps(values, DEFAULTS, DEMO_ONLY), children: values.text }}
          changed={changed}
        />
      </div>
    </div>
  )
}
