"use client"

import * as React from "react"
import { Code2, ExternalLink, Eye, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react"
import { previewTabClass, previewTabsListClass, stageClass } from "@/components/site/component-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const WIDTHS = [
  { label: "Desktop", value: "100%", Icon: Monitor },
  { label: "Tablet", value: "768px", Icon: Tablet },
  { label: "Mobile", value: "390px", Icon: Smartphone },
] as const

const toolButtonClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"

export function BlockPreview({ name, code }: { name: string; code: React.ReactNode }) {
  const [width, setWidth] = React.useState<string>("100%")
  const [run, setRun] = React.useState(0)

  return (
    <Tabs defaultValue="preview" className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList className={previewTabsListClass}>
          <TabsTrigger value="preview" className={previewTabClass}>
            <Eye aria-hidden />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className={previewTabClass}>
            <Code2 aria-hidden />
            Code
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Preview width" className="flex h-10 items-center gap-0.5 rounded-xl border bg-card/60 p-1 max-sm:hidden">
            {WIDTHS.map(({ label, value, Icon }) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={width === value}
                onClick={() => setWidth(value)}
                className={cn(toolButtonClass, width === value && "bg-background text-foreground dark:bg-accent")}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
          <div className="flex h-10 items-center gap-0.5 rounded-xl border bg-card/60 p-1">
            <button type="button" aria-label="Reload preview" title="Reload" onClick={() => setRun((count) => count + 1)} className={toolButtonClass}>
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <a href={`/preview/${name}`} target="_blank" rel="noreferrer" aria-label="Open preview in a new tab" title="Open in a new tab" className={toolButtonClass}>
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>
      <TabsContent value="preview">
        <div className={cn(stageClass, "flex justify-center p-3 sm:p-4")}>
          <iframe
            key={run}
            title={`${name} preview`}
            src={`/preview/${name}`}
            style={{ width }}
            className="h-160 max-w-full rounded-xl border bg-background shadow-xl shadow-black/10 transition-[width] duration-300"
          />
        </div>
      </TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
