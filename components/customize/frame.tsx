"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Code2, Copy, Eye, Palette, RotateCcw } from "lucide-react"
import { previewTabClass, previewTabsListClass, stageClass } from "@/components/site/component-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { type Token, type TokenKind, type Usage, tokenize, usageText } from "./usage"

const actionClass =
  "inline-flex h-7.5 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color,opacity,transform] duration-150 hover:bg-background hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring/60"

/**
 * A piece's preview with its Customize panel: the same Preview and Code tabs and stage as `ComponentPreview`,
 * the panel directly under the stage (a heading, Reset while something is changed, a three-column grid of rows),
 * and, in the Code tab, the usage snippet with the changed props above the source.
 */
export function CustomizeFrame({
  code,
  usage,
  preview,
  run,
  onReplay,
  changed,
  onReset,
  studioHref,
  stageClassName,
  children,
}: {
  /** The highlighted source, from the page. */
  code: React.ReactNode
  /** The usage snippet's parts; left out, the Code tab shows the source alone. */
  usage?: Usage
  /** The piece, rendered from the current values. */
  preview: React.ReactNode
  /** Remounts the preview when it changes. */
  run: number
  onReplay: () => void
  changed: boolean
  onReset: () => void
  /** Where the Background Studio opens this piece, for the backgrounds it has. */
  studioHref?: string
  stageClassName?: string
  /** The control rows. */
  children: React.ReactNode
}) {
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
        <div className={cn(stageClass, "flex min-h-115 items-center justify-center p-6 sm:p-10", stageClassName)}>
          <button
            type="button"
            aria-label="Replay animation"
            title="Replay"
            onClick={onReplay}
            className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-lg border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
          <div key={run} className="flex w-full items-center justify-center">
            {preview}
          </div>
        </div>
        <section aria-labelledby="customize-heading" className="@container mt-6 rounded-2xl border bg-muted/50 p-1">
          <div className="flex min-h-11.5 items-center justify-between gap-4 py-2 pr-2 pl-3.5">
            <h2 id="customize-heading" className="text-sm font-semibold tracking-[-0.01em]">
              Customize
            </h2>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={onReset} disabled={!changed} aria-hidden={!changed} tabIndex={changed ? 0 : -1} className={cn(actionClass, !changed && "pointer-events-none invisible opacity-0")}>
                <RotateCcw className="size-3.5" aria-hidden />
                Reset
              </button>
              {studioHref ? (
                <Link href={studioHref} className={actionClass}>
                  <Palette className="size-3.5" aria-hidden />
                  Open in Studio
                </Link>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-[calc(var(--radius-2xl)_-_5px)] border bg-background p-3 @[26rem]:grid-cols-2 @[40rem]:grid-cols-3 [&>*:not([data-control])]:col-span-full">{children}</div>
        </section>
      </TabsContent>
      <TabsContent value="code" className="space-y-4">
        {usage ? <UsageBlock usage={usage} changed={changed} /> : null}
        {code}
      </TabsContent>
    </Tabs>
  )
}

// github-light and github-dark, the themes the source block is highlighted in
const COLORS: Record<TokenKind, [light: string, dark: string]> = {
  plain: ["#24292f", "#c9d1d9"],
  text: ["#24292f", "#c9d1d9"],
  keyword: ["#cf222e", "#ff7b72"],
  tag: ["#116329", "#7ee787"],
  attr: ["#0550ae", "#79c0ff"],
  value: ["#0550ae", "#79c0ff"],
  string: ["#0a3069", "#a5d6ff"],
}

function Line({ tokens }: { tokens: Token[] }) {
  return (
    <span className="line">
      {tokens.map((token, index) => (
        <span key={index} style={{ "--shiki-light": COLORS[token.kind][0], "--shiki-dark": COLORS[token.kind][1] } as React.CSSProperties}>
          {token.text}
        </span>
      ))}
    </span>
  )
}

/** The usage snippet, highlighted like the source, with a copy button and a note while it carries changes. */
export function UsageBlock({ usage, changed }: { usage: Usage; changed: boolean }) {
  const text = usageText(usage)
  const lines = tokenize(text)
  const [copied, setCopied] = React.useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="overflow-hidden rounded-2xl border bg-card/60">
      <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
        Usage
        {changed ? <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">With your settings</span> : null}
        <button type="button" onClick={copy} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors hover:bg-accent hover:text-foreground">
          {copied ? <Check className="size-3.5 text-brand-text" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="shiki overflow-x-auto p-5 text-[13px] leading-relaxed">
        <code>
          {lines.map((tokens, index) => (
            <React.Fragment key={index}>
              <Line tokens={tokens} />
              {index < lines.length - 1 ? "\n" : null}
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  )
}
