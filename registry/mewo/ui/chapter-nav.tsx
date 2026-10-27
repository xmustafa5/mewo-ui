"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChapterNavChapter {
  title: string
  /** Where the chapter starts, in the story's viewport heights. */
  start: number
}

export interface ChapterNavLabels {
  /** The dots button and the chapters list. */
  chapters?: string
  close?: string
}

export interface ChapterNavProps extends React.ComponentProps<"div"> {
  /** The chapters, in order. */
  chapters?: ChapterNavChapter[]
  /** Chapter boundaries, one more than the chapters: dot i fills from bounds[i] to bounds[i + 1]. Defaults to the
   * chapters' starts. */
  bounds?: number[]
  /** The reader's position, in the same unit as the starts (viewport heights). */
  progress?: number
  /** The panel's heading. */
  title?: string
  /** The wordmark at the foot of the panel. */
  brand?: string
  /** Small line under the wordmark. */
  copyright?: string
  /** The dots fade in once true (e.g. when an intro ends). */
  visible?: boolean
  /** Whether the chapters panel is open, to control it with onOpenChange (one panel at a time on a page). Left out,
   * the nav keeps its own state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called with a chapter's start when the reader picks it; the page scrolls there. */
  onChapter?: (start: number) => void
  /** Accessible names, in the page's language. */
  labels?: ChapterNavLabels
}

const LABELS: Required<ChapterNavLabels> = { chapters: "Chapters", close: "Close" }

// The panel's opening runs on a registered number, 0 closed to 1 open, and its clip is worked out from it on every
// frame. A transition of clip-path itself can be handed to the compositor, which inside a rounded, overflow-clipped
// box (a demo's frame) draws nothing until it ends, so the panel just appears.
if (typeof CSS !== "undefined" && "registerProperty" in CSS) {
  try {
    CSS.registerProperty({ name: "--chapter-nav-reveal", syntax: "<number>", inherits: false, initialValue: "0" })
  } catch {}
}
const GLASS = "bg-[rgba(186,186,186,0.2)] backdrop-blur-[12px]"
const ITEM_DELAYS = ["", "", "delay-50", "delay-100", "delay-150", "delay-200"]

// panel content rises into place in turn while the panel opens
const item = (open: boolean, i: number) =>
  cn(
    "[transition:opacity_0.5s_ease,translate_0.6s_cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none",
    open ? cn("translate-y-0 opacity-100", ITEM_DELAYS[i]) : "translate-y-[calc(var(--story-u)*4)] opacity-0"
  )

/**
 * Chapter navigation for a long scroll story: a glass rail of dots at the inline end, the current chapter's dot
 * stretched and filling as you read, that opens a panel listing the chapters with a progress bar under each.
 * Picking a chapter reports its start; the page scrolls. Mirrors in right-to-left pages.
 */
export function ChapterNav({
  chapters = [
    { title: "One object, many keepers", start: 0 },
    { title: "Empires and capitals", start: 18.6 },
    { title: "Scattered and recovered", start: 51.5 },
  ],
  bounds,
  progress = 0,
  title = "Chapters",
  brand = "Atlas",
  copyright = "© Atlas",
  visible = true,
  open,
  onOpenChange,
  onChapter,
  labels,
  className,
  ...props
}: ChapterNavProps) {
  const [innerOpen, setInnerOpen] = React.useState(false)
  const isOpen = open ?? innerOpen
  const l = { ...LABELS, ...labels }
  const id = React.useId()
  const button = React.useRef<HTMLButtonElement>(null)
  const panel = React.useRef<HTMLElement>(null)
  // focus goes back to the dots only when the nav closed itself, not when another panel took over
  const returnFocus = React.useRef(false)

  const b = bounds ?? [...chapters.map((c) => c.start), (chapters.at(-1)?.start ?? 0) + 30]
  const chapter = Math.max(0, chapters.findIndex((_, i) => progress >= b[i]! && progress < b[i + 1]!), progress >= b.at(-1)! ? chapters.length - 1 : 0)
  const chapterProgress = (i: number) => Math.min(1, Math.max(0, (progress - b[i]!) / (b[i + 1]! - b[i]!)))

  const setOpen = (next: boolean, focusButton = false) => {
    returnFocus.current = !next && focusButton
    if (open === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }

  React.useEffect(() => {
    if (isOpen) panel.current?.querySelector<HTMLElement>("[data-chapter]")?.focus()
    else if (returnFocus.current) button.current?.focus()
    returnFocus.current = false
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      returnFocus.current = true
      if (open === undefined) setInnerOpen(false)
      onOpenChange?.(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, open, onOpenChange])

  return (
    <div data-slot="chapter-nav" className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", "contents", className)} {...props}>
      <button
        ref={button}
        aria-controls={id}
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen, true)}
        className={cn(
          "fixed z-[100] top-1/2 end-[calc(var(--story-u)*2)] grid w-[calc(var(--story-u)*4)] -translate-y-1/2 cursor-pointer justify-items-center gap-[4px] rounded-md py-[calc(var(--story-u)*2)] transition-opacity duration-600 motion-reduce:transition-none",
          "max-[900px]:end-[calc(var(--story-u)*1)] max-[900px]:w-[calc(var(--story-u)*2)] max-[900px]:py-[calc(var(--story-u)*1)]",
          GLASS,
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {chapters.map((c, i) => (
          <span
            key={c.title}
            className={cn(
              "relative h-[5px] w-[5px] overflow-hidden rounded-[calc(var(--story-u)*0.25)] transition-[height] duration-800 ease-in-out motion-reduce:transition-none",
              "before:absolute before:inset-0 before:bg-black before:opacity-10 before:content-['']",
              i === chapter && "h-[calc(var(--story-u)*3)]"
            )}
          >
            <span
              className="absolute inset-0 bg-black"
              style={{ transform: i === chapter ? `translateY(${(chapterProgress(i) - 1) * 100}%)` : "translateY(-100%)" }}
            />
          </span>
        ))}
        <span className="sr-only">{l.chapters}</span>
      </button>
      <section
        id={id}
        ref={panel}
        aria-label={l.chapters}
        inert={!isOpen}
        className={cn(
          "fixed z-[100] end-[calc(var(--story-u)*2)] top-1/2 grid w-[calc(var(--story-u)*50.8)] -translate-y-1/2 content-start gap-[calc(var(--story-u)*2)] rounded-lg px-[calc(var(--story-u)*4)] pt-[calc(var(--story-u)*4)] pb-[calc(var(--story-u)*3.6)]",
          "max-[900px]:start-[calc(var(--story-u)*1.5)] max-[900px]:end-[calc(var(--story-u)*1.5)] max-[900px]:top-auto max-[900px]:bottom-[calc(var(--story-u)*1.5)] max-[900px]:w-auto max-[900px]:translate-y-0 motion-reduce:transition-none",
          GLASS,
          // closed (reveal 0) the clip is the rail of dots the panel opened from; open (reveal 1) the whole panel
          "[clip-path:inset(calc((50%-calc(var(--story-u)*4.5))*(1-var(--chapter-nav-reveal)))_0_calc((50%-calc(var(--story-u)*4.5))*(1-var(--chapter-nav-reveal)))_calc((100%-calc(var(--story-u)*4))*(1-var(--chapter-nav-reveal)))_round_calc(var(--story-u)*1.2))]",
          "rtl:[clip-path:inset(calc((50%-calc(var(--story-u)*4.5))*(1-var(--chapter-nav-reveal)))_calc((100%-calc(var(--story-u)*4))*(1-var(--chapter-nav-reveal)))_calc((50%-calc(var(--story-u)*4.5))*(1-var(--chapter-nav-reveal)))_0_round_calc(var(--story-u)*1.2))]",
          isOpen
            ? "visible [--chapter-nav-reveal:1] [transition:--chapter-nav-reveal_0.8s_cubic-bezier(0.455,0.03,0.515,0.955)]"
            : cn(
                "pointer-events-none invisible [--chapter-nav-reveal:0] [transition:--chapter-nav-reveal_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s_linear_0.8s]"
              )
        )}
      >
        <button className="absolute top-[calc(var(--story-u)*2.2)] end-[calc(var(--story-u)*2.2)] size-[calc(var(--story-u)*1)] cursor-pointer" onClick={() => setOpen(false, true)}>
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="sr-only">{l.close}</span>
        </button>
        <h2 className={cn("text-[length:max(11px,calc(var(--story-u)*1.4))] font-medium tracking-[-0.01em] max-[900px]:text-[length:calc(var(--story-u)*1.4)]", item(isOpen, 1))}>{title}</h2>
        <nav aria-label={l.chapters}>
          <ol className="grid">
            {chapters.map((c, i) => (
              <li key={c.title} className={item(isOpen, Math.min(i + 2, 4))}>
                <button
                  data-chapter
                  onClick={() => {
                    setOpen(false)
                    onChapter?.(c.start)
                  }}
                  className="grid w-full cursor-pointer grid-cols-[calc(var(--story-u)*4)_1fr] gap-[calc(var(--story-u)*0.6)] pt-[calc(var(--story-u)*2)] text-start font-heading text-[length:calc(var(--story-u)*1.5)]"
                >
                  <span className="font-sans text-[length:calc(var(--story-u)*1.2)] font-medium tracking-[-0.01em] opacity-50">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pb-[calc(var(--story-u)*2)] text-[length:calc(var(--story-u)*2.6)] leading-[1.1]">{c.title}</span>
                  <span className="col-span-full h-[2px] overflow-hidden bg-[rgba(13,13,13,0.05)]">
                    <span className="block h-full origin-left bg-black rtl:origin-right" style={{ transform: `scaleX(${chapterProgress(i)})` }} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <footer className={cn("grid gap-[calc(var(--story-u)*1)] pt-[calc(var(--story-u)*1.6)]", item(isOpen, 5))}>
          <span className="font-heading text-[length:calc(var(--story-u)*2)]">{brand}</span>
          <span className="text-[9px] opacity-50">{copyright}</span>
        </footer>
      </section>
    </div>
  )
}
