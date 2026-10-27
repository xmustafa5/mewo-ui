"use client"

import { ChevronsUpDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/mewo/ui/collapsible"
import { Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { defaultOpen: false }
export const DEMO_ONLY = [] as const

const CHILDREN = "<CollapsibleTrigger>What does this replace?</CollapsibleTrigger>\n<CollapsibleContent>\n  <p>This one animates its height and fades the content in.</p>\n</CollapsibleContent>"

export default function CollapsibleCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "Collapsible", item: "collapsible", props: changedProps(values, defaults, DEMO_ONLY), children: CHILDREN }}
      preview={
        // keyed on the value: the address is read after the first render, and an uncontrolled panel takes its initial state only once
        <Collapsible key={String(values.defaultOpen)} defaultOpen={values.defaultOpen} className="flex w-full max-w-sm flex-col rounded-lg border p-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md text-left text-sm font-medium outline-none transition-colors hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50">
            What does this replace?
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3 text-sm text-muted-foreground">
              <p>shadcn&apos;s collapsible renders the Base UI panel with no styling and no animation, so it appears at full height instantly.</p>
              <p className="mt-2">This one animates its height and fades the content in.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      }
    >
      {/* the initial state is read once, as the piece mounts */}
      <Switch label="Open at start" checked={values.defaultOpen} onChange={(value) => set("defaultOpen", value, { replay: true })} />
    </CustomizeFrame>
  )
}
