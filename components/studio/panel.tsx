"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Redo2, RotateCcw, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { docsPath } from "./catalog"
import { PropControls } from "./controls"
import { useScrollEdges } from "./hooks/use-scroll-edges"
import type { StudioState } from "./hooks/use-studio-state"
import { colorsOf } from "./preset-colors"
import { IconButton, Kbd } from "./ui"

const sectionClass = "flex-none rounded-xl border bg-background/40"
const headingClass = "flex min-h-10 items-center justify-between gap-2 px-3 py-1.5"
const headingActionClass =
  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-35"

function PresetTile({
  label,
  colors,
  active,
  onSelect,
}: {
  label: string
  colors: string[]
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex h-9.5 min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {colors.length > 0 ? (
        <span aria-hidden className="flex shrink-0">
          {colors.map((color) => (
            <i
              key={color}
              className="-ml-1 size-3 rounded-full ring-[1.5px] ring-card first:ml-0"
              style={{ background: color }}
            />
          ))}
        </span>
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  )
}

export function Panel({
  state,
  onStep,
  className,
}: {
  state: StudioState
  onStep: (direction: 1 | -1) => void
  className?: string
}) {
  const { entry, activePreset, defaults, props } = state
  const scrollRef = useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scrollRef, "[data-option]")
  const definitions = useMemo(() => entry.props.filter((definition) => definition.name !== "paused"), [entry])

  const tiles = useMemo(
    () =>
      (entry.presets ?? []).map((preset) => ({
        preset,
        colors: colorsOf({ ...defaults, ...preset.props }, definitions),
      })),
    [entry, defaults, definitions],
  )

  // A new background means new controls: start them from the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [entry.id])

  const more = !edges.bottom && edges.below > 0

  return (
    <aside aria-label="Background settings" className={cn("flex min-h-0 flex-col gap-3", className)}>
      <header className="flex flex-none flex-col gap-1.5 px-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-[-0.025em]">{entry.label}</h1>
          <div className="flex shrink-0 gap-0.5">
            <IconButton label="Previous background" hint="←" icon={ChevronLeft} onClick={() => onStep(-1)} />
            <IconButton label="Next background" hint="→" icon={ChevronRight} onClick={() => onStep(1)} />
          </div>
        </div>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{entry.description}</p>
        <Link
          href={docsPath(entry)}
          className="mt-0.5 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-foreground/85 transition-colors hover:text-foreground"
        >
          Open in docs
          <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
        </Link>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-linear-to-b from-card to-transparent transition-opacity",
            edges.top && "opacity-0",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-linear-to-t from-card to-transparent transition-opacity",
            edges.bottom && "opacity-0",
          )}
        />
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-2 scrollbar-thin"
        >
          {tiles.length > 0 ? (
            <section className={sectionClass} aria-labelledby="studio-presets">
              <div className={headingClass}>
                <h2 id="studio-presets" className="text-sm font-semibold">
                  Presets
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1.5 pt-0">
                {tiles.map(({ preset, colors }) => (
                  <PresetTile
                    key={preset.value}
                    label={preset.label}
                    colors={colors}
                    active={activePreset === preset.value}
                    onSelect={() => state.applyPreset(preset.value)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className={sectionClass} aria-labelledby="studio-customize">
            <div className={headingClass}>
              <h2 id="studio-customize" className="text-sm font-semibold">
                Customize
              </h2>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={state.reset}
                  disabled={!state.canReset}
                  aria-hidden={!state.canReset}
                  tabIndex={state.canReset ? 0 : -1}
                  className={cn(headingActionClass, "transition-opacity", !state.canReset && "opacity-0")}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset
                </button>
                <button
                  type="button"
                  aria-label="Undo"
                  title="Undo (⌘Z)"
                  onClick={state.undo}
                  disabled={!state.canUndo}
                  className={cn(headingActionClass, "w-7 px-0")}
                >
                  <Undo2 className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Redo"
                  title="Redo (⇧⌘Z)"
                  onClick={state.redo}
                  disabled={!state.canRedo}
                  className={cn(headingActionClass, "w-7 px-0")}
                >
                  <Redo2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 p-1.5 pt-0 [&>*]:data-[option]:block">
              {definitions.length ? (
                definitions.map((definition) => (
                  <div key={definition.name} data-option>
                    <PropControls definitions={[definition]} props={props} onChange={state.setProp} />
                  </div>
                ))
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">This background has no settings.</p>
              )}
            </div>
          </section>
        </div>
        <button
          type="button"
          tabIndex={more ? 0 : -1}
          onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: "smooth" })}
          className={cn(
            "absolute bottom-3.5 left-1/2 z-20 inline-flex h-7 -translate-x-1/2 items-center gap-1 rounded-lg border bg-background/80 pr-2 pl-3 text-xs font-medium text-muted-foreground backdrop-blur transition-[opacity,transform] hover:text-foreground",
            !more && "pointer-events-none translate-y-1.5 opacity-0",
          )}
        >
          {edges.below} more
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>
      <p className="sr-only">
        Shortcuts: <Kbd>Space</Kbd> pause, <Kbd>R</Kbd> replay, <Kbd>S</Kbd> snapshot, <Kbd>F</Kbd> fullscreen,{" "}
        <Kbd>E</Kbd> export, arrows switch background.
      </p>
    </aside>
  )
}
