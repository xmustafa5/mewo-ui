"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, RotateCcw } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { Slider } from "@/components/customize/controls"
import { useIsLight } from "@/components/customize/use-customize"
import { useNearOnce } from "@/components/site/home/use-near-once"
import { CATALOG, DEFAULT_BACKGROUND, findEntry, presetProps, themeDefaults } from "@/components/studio/catalog"
import { CONTENT_MODES, ContentOverlay, NARROW_WIDTH, contentModesFor, contentView, type ContentMode } from "@/components/studio/content-overlay"
import { writeDocument } from "@/components/studio/params"
import type { Props, StudioComponent, StudioEntry } from "@/components/studio/types"
import { brandButtonClass, groupClass, IconButton, Track } from "@/components/studio/ui"
import { cn } from "@/lib/utils"

/** The three controls each background shows here: the ones whose effect is plain to see. The studio has them all. */
const SLIDERS: Record<string, string[]> = {
  "pattern-waves": ["spacing", "depth", "speed"],
  grainient: ["flow", "speed", "grainAmount"],
  "dot-grid": ["dotSize", "gap", "glow"],
}

const slidersOf = (entry: StudioEntry) => {
  const names = SLIDERS[entry.id] ?? entry.props.filter((prop) => prop.type === "number").slice(0, 3).map((prop) => prop.name)
  return names.flatMap((name) => entry.props.filter((prop) => prop.name === name && prop.type === "number"))
}

const swatchOf = (entry: StudioEntry) => `linear-gradient(135deg, ${entry.swatch.join(", ")})`

const chipClass =
  "inline-flex h-7.5 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 aria-pressed:border-foreground/40 aria-pressed:bg-accent aria-pressed:text-foreground text-muted-foreground"

/**
 * The Background Studio in miniature, working: the rail of backgrounds, the stage with sample content over it,
 * the presets and three of the controls. The background is the real registry component with the studio's own
 * defaults, loaded once the section is near the viewport and never for a visitor who asked for reduced motion
 * (they see its colours). "Open in Studio" carries the exact settings into the real thing.
 */
export function StudioDemo() {
  const [id, setId] = React.useState(DEFAULT_BACKGROUND)
  const [preset, setPreset] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<Props>({})
  const [mode, setMode] = React.useState<ContentMode>("landing")
  const [run, setRun] = React.useState(0)
  const [loaded, setLoaded] = React.useState<Record<string, StudioComponent>>({})
  const [narrow, setNarrow] = React.useState(false)
  const stage = React.useRef<HTMLDivElement>(null)
  const [ref, near] = useNearOnce("300px")
  const reducedMotion = useReducedMotion() === true
  const light = useIsLight()

  const entry = findEntry(id) ?? CATALOG[0]
  const Background = loaded[entry.id]
  const live = near && !reducedMotion
  const props: Props = { ...themeDefaults(entry, light), ...presetProps(entry, preset), ...changes }
  const changed = preset !== null || Object.keys(changes).length > 0
  const view = contentView(mode, narrow)
  const studioHref = `/studio?${writeDocument({ id: entry.id, preset, changes }, entry).toString()}`

  // the background's code, fetched when the stage is near and the visitor can see motion
  React.useEffect(() => {
    if (!live || loaded[entry.id]) return
    let cancelled = false
    entry.load().then((Component) => {
      if (!cancelled) setLoaded((current) => ({ ...current, [entry.id]: Component }))
    })
    return () => {
      cancelled = true
    }
  }, [live, entry, loaded])

  // the landing page sample needs room: a narrow stage shows the phone instead, as the studio does
  React.useEffect(() => {
    const element = stage.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([item]) => {
      if (item) setNarrow(item.contentRect.width < NARROW_WIDTH)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const choose = (next: string) => {
    setId(next)
    setPreset(null)
    setChanges({})
  }
  const pick = (value: string) => {
    setPreset((current) => (current === value ? null : value))
    setChanges({})
  }
  const reset = () => {
    setPreset(null)
    setChanges({})
  }

  return (
    <div ref={ref} data-slot="studio-demo" className="rounded-3xl border bg-card/50 p-2 shadow-2xl shadow-black/10">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[12.5rem_minmax(0,1fr)_17rem]">
        {/* the rail: every background the studio has */}
        <nav aria-label="Backgrounds" className="rounded-2xl border bg-card/60 p-1.5">
          <p className="px-2 pt-1.5 pb-2 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">
            {CATALOG.length} backgrounds
          </p>
          <ul className="flex gap-1 max-lg:overflow-x-auto lg:flex-col">
            {CATALOG.map((item) => {
              const active = item.id === entry.id
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => choose(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl p-1.5 pr-3 text-left text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                      active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span aria-hidden className="h-8.5 w-13.5 shrink-0 rounded-md border border-foreground/10" style={{ background: swatchOf(item) }} />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* the stage and its toolbar */}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Track label="Sample content" value={mode} options={contentModesFor(narrow)} onChange={setMode} iconOnly className="w-fit" />
            <div className="flex items-center gap-2">
              <div role="group" aria-label="Preview controls" className={groupClass}>
                <IconButton label="Replay intro" icon={RotateCcw} onClick={() => setRun((count) => count + 1)} disabled={!Background} />
              </div>
              <Link href={studioHref} className={cn(brandButtonClass, "group")}>
                Open in Studio
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </div>
          <div ref={stage} className="relative h-105 overflow-hidden rounded-2xl border bg-background lg:h-120">
            {/* the background's colours stand in until it runs, and for a visitor who asked for reduced motion */}
            <div aria-hidden className={cn("absolute inset-0 transition-opacity duration-700", Background ? "opacity-0" : "opacity-40")} style={{ background: swatchOf(entry) }} />
            {Background ? <Background key={`${entry.id}-${run}`} {...props} className="absolute inset-0" /> : null}
            <ContentOverlay view={view} />
          </div>
        </div>

        {/* the panel: what the background is, its presets, three of its controls */}
        <aside className="flex flex-col gap-3 rounded-2xl border bg-card/60 p-3.5">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.01em]">{entry.label}</h3>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{entry.description}</p>
          </div>
          {entry.presets?.length ? (
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.presets.map((item) => (
                  <button key={item.value} type="button" aria-pressed={preset === item.value} onClick={() => pick(item.value)} className={chipClass}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="@container">
            <div className="mb-2 flex min-h-5 items-center justify-between">
              <p className="text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">Customize</p>
              <button
                type="button"
                onClick={reset}
                disabled={!changed}
                aria-hidden={!changed}
                tabIndex={changed ? 0 : -1}
                className={cn("inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground", !changed && "invisible")}
              >
                <RotateCcw className="size-3" aria-hidden />
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {slidersOf(entry).map((definition) => (
                <Slider
                  key={`${entry.id}-${definition.name}`}
                  label={definition.label}
                  min={definition.min}
                  max={definition.max}
                  step={definition.step}
                  value={Number(props[definition.name])}
                  onChange={(value) => setChanges((current) => ({ ...current, [definition.name]: value }))}
                />
              ))}
            </div>
          </div>
          <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
            The studio has every control, {CONTENT_MODES.length - 1} kinds of sample content, undo, and the export.
          </p>
        </aside>
      </div>
    </div>
  )
}
