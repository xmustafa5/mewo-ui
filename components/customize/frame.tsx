"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Code2, Copy, Eye, GripVertical, Monitor, Palette, RotateCcw, Smartphone, Tablet } from "lucide-react"
import { previewTabClass, previewTabsListClass, stageClass } from "@/components/site/component-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { type Token, type TokenKind, type Usage, tokenize, usageText } from "./usage"

const actionClass =
  "inline-flex h-7.5 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color,opacity,transform] duration-150 hover:bg-background hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring/60"
const toolButtonClass = "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"

/** The narrowest the preview goes, and the widths the toolbar offers; the frame is the stage's width otherwise. */
const MIN_WIDTH = 320
const WIDTHS = [
  { label: "Desktop", width: null, Icon: Monitor },
  { label: "Tablet · 768px", width: 768, Icon: Tablet },
  { label: "Mobile · 375px", width: 375, Icon: Smartphone },
] as const
const INDICATOR_MS = 2000
const KEY_STEP = 10
const KEY_STEP_LARGE = 50
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * The preview's width: a preset from the toolbar, or any width by the handle on the frame's edge (the arrow keys
 * step it, Home and End go to the ends, a double-click lets it go). `null` is the stage's full width.
 */
function usePreviewWidth(stageRef: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = React.useState<number | null>(null)
  const [full, setFull] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const [indicator, setIndicator] = React.useState(false)
  const drag = React.useRef<{ id: number; startX: number; startWidth: number } | null>(null)
  const hideTimer = React.useRef(0)

  // the stage's content width bounds the frame, and a window that gets narrower than a set width lets it go
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const styles = getComputedStyle(stage)
      const inner = stage.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
      // 0 until the stage has a size: nothing is bounded by it yet
      const next = inner > 0 ? Math.max(MIN_WIDTH, Math.floor(inner)) : 0
      setFull(next)
      setWidth((current) => (next && current !== null && current >= next ? null : current))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [stageRef])
  React.useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  const show = () => {
    setIndicator(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setIndicator(false), INDICATOR_MS)
  }
  const commit = (next: number | null) => {
    const rounded = next === null ? null : Math.round(clamp(next, MIN_WIDTH, full || next))
    setWidth(rounded !== null && full && rounded >= full ? null : rounded)
    show()
  }
  const current = width ?? full

  const handle = {
    role: "separator" as const,
    tabIndex: 0,
    "aria-orientation": "vertical" as const,
    "aria-label": "Drag to resize the preview",
    "aria-valuemin": MIN_WIDTH,
    "aria-valuemax": full,
    "aria-valuenow": Math.round(current),
    "data-dragging": dragging || undefined,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      drag.current = { id: event.pointerId, startX: event.clientX, startWidth: current }
      setDragging(true)
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (drag.current?.id !== event.pointerId) return
      // the frame is centred, so the edge moves half as far as the width changes
      commit(drag.current.startWidth + (event.clientX - drag.current.startX) * 2)
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (drag.current?.id !== event.pointerId) return
      drag.current = null
      setDragging(false)
    },
    onPointerCancel: () => {
      drag.current = null
      setDragging(false)
    },
    onDoubleClick: () => commit(null),
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP
      const targets: Record<string, number | null> = { ArrowLeft: current - step, ArrowRight: current + step, Home: MIN_WIDTH, End: null }
      if (!(event.key in targets)) return
      event.preventDefault()
      commit(targets[event.key])
    },
  }

  return { width, full, dragging, indicator: dragging || (indicator && width !== null), set: commit, handle }
}

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
  const stageRef = React.useRef<HTMLDivElement>(null)
  const size = usePreviewWidth(stageRef)
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
        <div role="group" aria-label="Preview width" className="flex h-10 items-center gap-0.5 rounded-xl border bg-card/60 p-1 max-sm:hidden">
          {WIDTHS.map(({ label, width, Icon }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={size.width === width}
              onClick={() => size.set(width)}
              className={cn(toolButtonClass, size.width === width && "bg-background text-foreground dark:bg-accent")}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>
      <TabsContent value="preview">
        <div ref={stageRef} className={cn(stageClass, "flex min-h-115 items-center justify-center p-6 sm:p-10", stageClassName)}>
          <button
            type="button"
            aria-label="Replay animation"
            title="Replay"
            onClick={onReplay}
            className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-lg border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
          {/* the frame: the stage's width, or the width set by a preset or the handle, centred */}
          <div
            data-slot="customize-frame"
            data-narrow={size.width !== null || undefined}
            data-dragging={size.dragging || undefined}
            className="group/frame relative flex w-full items-center justify-center rounded-xl transition-[max-width] duration-300 data-dragging:transition-none data-narrow:outline-1 data-narrow:outline-dashed data-narrow:outline-border data-narrow:outline-offset-8"
            style={{ maxWidth: size.width ?? undefined }}
          >
            <div key={run} className="flex w-full items-center justify-center">
              {preview}
            </div>
            <div
              {...size.handle}
              className="absolute top-1/2 -right-7 z-10 flex h-16 w-6 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-md text-muted-foreground/50 outline-none transition-colors group-hover/frame:text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring/60 data-dragging:text-foreground max-sm:hidden"
            >
              <GripVertical className="size-4" aria-hidden />
            </div>
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md border bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums backdrop-blur transition-opacity duration-200",
                size.indicator ? "opacity-100" : "opacity-0",
              )}
            >
              {Math.round(size.width ?? size.full)}px
            </span>
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
