"use client"

import { GlassPanel, GlassPanelContent, GlassPanelFooter, GlassPanelTitle, GlassPanelTrigger } from "@/registry/mewo/ui/glass-panel"
import { Input, Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Width = "wide" | "narrow"

export const DEFAULTS = { open: true, title: "About this story", lines: 3, width: "wide" as Width, showCloseButton: true }
// `showCloseButton` is a prop of GlassPanelContent, not of the root: the usage prints it on the content, inside the children
export const DEMO_ONLY = ["open", "title", "lines", "width", "showCloseButton"] as const

const LINES = [
  "A scroll story that follows objects, people and places through a long history.",
  "Pictures come from open collections, credited with each one.",
  "Close the panel and open it again: it grows out of its button.",
]
const LINE_CLASS = ["font-heading text-[length:calc(var(--story-u)*2)] leading-[1.4]", "text-[length:calc(var(--story-u)*1.4)] leading-[1.4] tracking-[-0.01em]"]
const NARROW = "w-[calc(var(--story-u)*34)]"
const WIDTH_OPTIONS = [
  { value: "wide", label: "Wide" },
  { value: "narrow", label: "Narrow" },
] as const

export default function GlassPanelCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const lines = LINES.slice(0, values.lines)
  const narrow = values.width === "narrow"
  // the demo opens its panel on load; off, the piece's own default (closed) needs no prop
  const computed = values.open ? { defaultOpen: true } : {}
  const contentAttrs = [values.showCloseButton ? "" : " showCloseButton={false}", narrow ? ` className="${NARROW}"` : ""].join("")
  const children = [
    '<GlassPanelTrigger className="fixed top-4 end-4 size-10 rounded-sm bg-primary">',
    `  <span className="sr-only">${values.title}</span>`,
    "</GlassPanelTrigger>",
    `<GlassPanelContent${contentAttrs}>`,
    `  <GlassPanelTitle>${values.title}</GlassPanelTitle>`,
    ...lines.map((line) => `  <p>${line}</p>`),
    "  <GlassPanelFooter>Atlas</GlassPanelFooter>",
    "</GlassPanelContent>",
  ].join("\n")
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "GlassPanel", item: "glass-panel", props: changedProps(values, defaults, DEMO_ONLY, computed), children }}
      preview={
        // a transformed box contains the panel's fixed pieces, so the preview stays in its frame
        <div className="relative h-[500px] w-full overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]">
          {/* keyed on the value: the address is read after the first render, and an uncontrolled panel takes its initial state only once */}
          <GlassPanel key={String(values.open)} defaultOpen={values.open}>
            <GlassPanelTrigger className="fixed top-[calc(var(--story-u)*2)] end-[calc(var(--story-u)*2)] grid size-[calc(var(--story-u)*4)] place-content-center gap-[calc(var(--story-u)*0.55)] rounded-sm bg-primary text-primary-foreground">
              <span className="block h-[2px] w-[calc(var(--story-u)*1.45)] rounded-[1px] bg-current" />
              <span className="block h-[2px] w-[calc(var(--story-u)*1.45)] rounded-[1px] bg-current" />
              <span className="sr-only">{values.title}</span>
            </GlassPanelTrigger>
            <GlassPanelContent showCloseButton={values.showCloseButton} className={narrow ? NARROW : undefined}>
              <GlassPanelTitle>{values.title}</GlassPanelTitle>
              {lines.map((line, index) => (
                <p key={line} className={LINE_CLASS[index === 0 ? 0 : 1]}>
                  {line}
                </p>
              ))}
              <GlassPanelFooter>
                <span className="font-heading text-[length:calc(var(--story-u)*2)]">Atlas</span>
                <span className="text-[9px] opacity-50">© Atlas</span>
              </GlassPanelFooter>
            </GlassPanelContent>
          </GlassPanel>
        </div>
      }
    >
      {/* whether the panel is open on load is read once, as the piece mounts */}
      <Switch label="Open at start" checked={values.open} onChange={(value) => set("open", value, { replay: true })} />
      <Input label="Title" value={values.title} onChange={(value) => set("title", value)} />
      <Slider label="Lines" min={1} max={LINES.length} step={1} value={values.lines} onChange={(value) => set("lines", value)} />
      <Select label="Width" options={WIDTH_OPTIONS} value={values.width} onChange={(value) => set("width", value)} />
      <Switch label="Close button" checked={values.showCloseButton} onChange={(value) => set("showCloseButton", value)} />
    </CustomizeFrame>
  )
}
