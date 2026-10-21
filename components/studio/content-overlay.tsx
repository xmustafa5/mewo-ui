"use client"

import { AppWindowMac, ArrowRight, IdCard, Menu, RectangleHorizontal, Smartphone } from "lucide-react"
import { MewoMark } from "@/components/site/mewo-mark"
import { SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { TrackOption } from "./ui"

/**
 * Sample content laid over the preview so a background can be judged with real text on it. It is drawn in
 * the studio page, not in the frame, so it never costs the background a frame and never ends up in a capture.
 */

export type ContentMode = "none" | "landing" | "mobile" | "card"

export const CONTENT_MODES: TrackOption<ContentMode>[] = [
  { value: "none", label: "Background only", icon: RectangleHorizontal },
  { value: "landing", label: "Landing page", icon: AppWindowMac },
  { value: "mobile", label: "Mobile", icon: Smartphone },
  { value: "card", label: "Card", icon: IdCard },
]

/** Below this stage width the landing page would not fit, so it shows as the phone instead. */
export const NARROW_WIDTH = 640

export const contentView = (mode: ContentMode, narrow: boolean): ContentMode =>
  mode === "landing" && narrow ? "mobile" : mode

export const contentModesFor = (narrow: boolean) =>
  narrow ? CONTENT_MODES.filter((mode) => mode.value !== "landing") : CONTENT_MODES

const HEADLINE = "Animated React components you own."
const DESCRIPTION = `${SITE_NAME} brings motion to your interface, one copy-paste component at a time.`
const LINKS = ["Docs", "Components", "Sections"]

const primaryClass =
  "inline-flex items-center gap-1.5 rounded-lg bg-brand font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]"
const ghostClass = "inline-flex items-center rounded-lg border bg-background/60 font-medium backdrop-blur"

function Copy({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-3 px-5" : "gap-5 px-8")}>
      <p className={cn("font-semibold tracking-[-0.03em] text-balance", compact ? "text-2xl" : "text-4xl sm:text-5xl")}>
        {HEADLINE}
      </p>
      <p className={cn("max-w-md text-muted-foreground", compact ? "text-sm" : "text-base")}>{DESCRIPTION}</p>
      <div className={cn("flex flex-wrap justify-center", compact ? "gap-2" : "gap-3")}>
        <span className={cn(primaryClass, compact ? "h-9 px-3.5 text-sm" : "h-11 px-5")}>
          Browse components
          <ArrowRight className="size-4" aria-hidden />
        </span>
        <span className={cn(ghostClass, compact ? "h-9 px-3.5 text-sm" : "h-11 px-5")}>Star on GitHub</span>
      </div>
    </div>
  )
}

function Nav({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="flex items-center gap-2">
        <MewoMark className="h-5 w-auto" />
        <span className="font-semibold tracking-tight">{SITE_NAME}</span>
      </span>
      {compact ? (
        <Menu className="ml-auto size-5 text-muted-foreground" aria-hidden />
      ) : (
        <>
          <span className="ml-6 flex gap-4 text-sm text-muted-foreground">
            {LINKS.map((link) => (
              <span key={link}>{link}</span>
            ))}
          </span>
          <span className={cn(primaryClass, "ml-auto h-8 px-3 text-sm")}>Get started</span>
        </>
      )}
    </div>
  )
}

function Landing() {
  return (
    <div className="flex aspect-[16/10] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-background/35 shadow-2xl shadow-black/20 backdrop-blur-[2px]">
      <div className="flex h-9 items-center gap-3 border-b bg-background/50 px-3.5">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <i key={dot} className="size-2.5 rounded-full bg-foreground/15" />
          ))}
        </span>
        <span className="mx-auto rounded-md bg-foreground/[0.06] px-8 py-0.5 text-[11px] text-muted-foreground">
          mewo-ui.com
        </span>
      </div>
      <Nav />
      <div className="flex flex-1 items-center justify-center py-6">
        <Copy />
      </div>
    </div>
  )
}

function Phone() {
  return (
    <div className="flex h-[min(600px,92%)] w-[300px] flex-col overflow-hidden rounded-[2.4rem] border-[6px] border-foreground/15 bg-background/35 shadow-2xl shadow-black/25 backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-6 pt-3 text-[12px] font-semibold">
        <span>9:41</span>
        <span className="h-5 w-20 rounded-full bg-foreground/80" />
        <span className="h-3 w-6 rounded-[3px] border border-foreground/60 p-px">
          <i className="block h-full w-4/5 rounded-[1px] bg-foreground/70" />
        </span>
      </div>
      <Nav compact />
      <div className="flex flex-1 items-center justify-center">
        <Copy compact />
      </div>
      <span className="mx-auto mb-2 h-1 w-28 rounded-full bg-foreground/50" />
    </div>
  )
}

function Card() {
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border bg-background/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand">
        <MewoMark eyes="var(--brand)" className="h-5 w-auto text-white" />
      </span>
      <p className="mt-5 text-xl font-semibold tracking-tight">{HEADLINE}</p>
      <p className="mt-2 text-sm text-muted-foreground">{DESCRIPTION}</p>
      <div className="mt-5 flex items-center gap-4">
        <span className={cn(primaryClass, "h-9 px-3.5 text-sm")}>Get started</span>
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          Learn more
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </div>
  )
}

export function ContentOverlay({ view }: { view: ContentMode }) {
  if (view === "none") return null
  return (
    <div
      key={view}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-5 flex items-center justify-center p-5 animate-in duration-300 fade-in zoom-in-[0.98] motion-reduce:animate-none sm:p-8"
    >
      {view === "landing" ? <Landing /> : view === "mobile" ? <Phone /> : <Card />}
    </div>
  )
}
