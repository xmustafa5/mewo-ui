"use client"

import * as React from "react"
import { Code2, Eye, RotateCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const previewTabsListClass = "h-10 rounded-xl border bg-card/60 p-1"
export const previewTabClass = "gap-1.5 rounded-lg px-3 data-active:bg-background dark:data-active:bg-accent"
export const stageClass = "relative overflow-hidden rounded-2xl border bg-card/40 bg-dots"

export function ComponentPreview({ children, code }: { children: React.ReactNode; code: React.ReactNode }) {
  // Bumping the key remounts the demo, so entrance animations play again.
  const [run, setRun] = React.useState(0)

  return (
    <Tabs defaultValue="preview" className="gap-3">
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
      <TabsContent value="preview">
        <div className={`${stageClass} flex min-h-115 items-center justify-center p-6 sm:p-10`}>
          <button
            type="button"
            aria-label="Replay animation"
            title="Replay"
            onClick={() => setRun((count) => count + 1)}
            className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-lg border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
          <div key={run} className="flex w-full items-center justify-center">
            {children}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
