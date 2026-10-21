"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { InstallCommand } from "@/components/site/install-command"
import { cn } from "@/lib/utils"
import { defaultProps } from "./catalog"
import type { StudioState } from "./hooks/use-studio-state"
import { sameValue } from "./params"
import { usageSnippet, type Placement } from "./snippet"
import type { Props } from "./types"
import { toolClass, Track } from "./ui"

const PLACEMENTS: { value: Placement; label: string }[] = [
  { value: "section", label: "Section" },
  { value: "page", label: "Page background" },
]

const remembered = { placement: "section" as Placement }

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
      }}
      className={cn(toolClass, "h-8 px-2.5 text-xs")}
    >
      {copied ? <Check className="size-3.5 text-brand-text" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  )
}

export function CodeExport({ state }: { state: StudioState }) {
  const { entry, props } = state
  const [placement, setPlacementState] = useState<Placement>(() => remembered.placement)

  const setPlacement = (value: Placement) => {
    remembered.placement = value
    setPlacementState(value)
  }

  // Only the props that differ from the component's own defaults make it into the snippet.
  const changed = useMemo(() => {
    const defaults = defaultProps(entry)
    const result: Props = {}
    for (const [name, value] of Object.entries(props)) {
      if (value !== undefined && !sameValue(value, defaults[name])) result[name] = value
    }
    return result
  }, [entry, props])

  const code = useMemo(() => usageSnippet(entry, changed, placement), [entry, changed, placement])

  return (
    <div className="space-y-4">
      <InstallCommand name={entry.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Track label="Placement" value={placement} options={PLACEMENTS} onChange={setPlacement} className="w-fit" />
        <CopyButton text={code} label="Copy code" />
      </div>
      <pre className="max-h-[52vh] overflow-auto rounded-xl border bg-card/60 p-4 font-mono text-[13px] leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  )
}
