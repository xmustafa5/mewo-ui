"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const WIDTHS = [
  { label: "Desktop", value: "100%" },
  { label: "Tablet", value: "768px" },
  { label: "Mobile", value: "390px" },
] as const

export function BlockPreview({ name, code }: { name: string; code: React.ReactNode }) {
  const [width, setWidth] = React.useState<string>("100%")

  return (
    <Tabs defaultValue="preview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div role="group" aria-label="Preview width" className="flex gap-1">
          {WIDTHS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={width === option.value}
              onClick={() => setWidth(option.value)}
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                width === option.value ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <TabsContent value="preview">
        <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
          <iframe
            title={`${name} preview`}
            src={`/preview/${name}`}
            style={{ width }}
            className="h-[640px] max-w-full rounded-md border bg-background transition-[width] duration-300"
          />
        </div>
      </TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
