"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Crosshair, PanelRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseMessage, pieceSpecs, type SitePiece } from "./protocol"
import { SitePieceCard } from "./site-piece-card"

export type SiteInfo = {
  slug: string
  title: string
  blurb: string
  url: string
  /** The address framed here. */
  frame: string
  /** The site's origin: messages are sent to it and accepted from it. */
  origin: string
  /** True when the site answers the viewer; without it there is no inspector. */
  embed: boolean
  /** The `source` the site's messages carry: its slug unless the manifest says otherwise. */
  source: string
  poster: string | null
}

const READY_PATIENCE_MS = 15000

/**
 * A site built with mewo pieces, framed under the header with the pieces it is built from beside it. The frame is
 * the only thing that scrolls. With Inspect on, pointing at the page outlines the piece under the pointer (the site
 * draws that itself), a click selects it here, a double-click opens its page, Escape leaves.
 */
export function SiteViewer({ site, pieces }: { site: SiteInfo; pieces: SitePiece[] }) {
  const router = useRouter()
  const frame = React.useRef<HTMLIFrameElement>(null)
  const [run, setRun] = React.useState(0)
  const [ready, setReady] = React.useState(false)
  const [slow, setSlow] = React.useState(false)
  const [inspect, setInspect] = React.useState(false)
  const [showList, setShowList] = React.useState(true)
  const [selected, setSelected] = React.useState<string | null>(null)
  const listed = pieces.filter((p) => !p.unlisted)
  const unlisted = pieces.filter((p) => p.unlisted)
  const specs = React.useMemo(() => pieceSpecs(pieces), [pieces])

  const send = React.useCallback(
    (message: Record<string, unknown>) => {
      try {
        frame.current?.contentWindow?.postMessage({ source: site.source, ...message }, site.origin)
      } catch {}
    },
    [site.source, site.origin]
  )

  // what the site says
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parseMessage(event, site.origin, site.source)
      if (!message) return
      if (message.type === "ready") setReady(true)
      if (message.type === "select") {
        setSelected(message.name)
        document.getElementById(`site-piece-${message.name}`)?.scrollIntoView({ block: "nearest" })
      }
      if (message.type === "open") router.push(`/docs/${message.name}`)
      if (message.type === "escape") setInspect(false)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [site.origin, site.source, router])

  // the inspector follows the toggle, and is sent again once the site is up
  React.useEffect(() => {
    if (!site.embed) return
    if (ready) send({ type: "inspect", on: inspect, pieces: specs })
  }, [inspect, ready, specs, send, site.embed])

  // Escape here leaves the inspector too
  React.useEffect(() => {
    if (!inspect) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspect(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [inspect])

  // a site that takes long to answer gets a line and the link out
  React.useEffect(() => {
    if (ready || !site.embed) return
    const timer = window.setTimeout(() => setSlow(true), READY_PATIENCE_MS)
    return () => window.clearTimeout(timer)
  }, [ready, run, site.embed])

  const reload = () => {
    setReady(false)
    setSlow(false)
    setSelected(null)
    setRun((n) => n + 1)
  }
  const selectedPiece = pieces.find((p) => p.name === selected)

  return (
    <div data-slot="site-viewer" className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">{site.title}</h1>
          <p className="text-sm text-muted-foreground">
            Built with mewo · {listed.length} {listed.length === 1 ? "component" : "components"}
            {unlisted.length ? ` and ${unlisted.length} simple ${unlisted.length === 1 ? "piece" : "pieces"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {site.embed ? (
            <button
              type="button"
              aria-pressed={inspect}
              onClick={() => setInspect((on) => !on)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                inspect ? "border-brand bg-brand text-brand-foreground" : "bg-background hover:bg-accent"
              )}
            >
              <Crosshair className="size-4" aria-hidden />
              Inspect
            </button>
          ) : null}
          <button
            type="button"
            aria-pressed={showList}
            onClick={() => setShowList((on) => !on)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
              showList ? "bg-accent" : "bg-background hover:bg-accent"
            )}
          >
            <PanelRight className="size-4" aria-hidden />
            List
          </button>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reload
          </button>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Open site
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>

      <div className={cn("grid min-h-0 flex-1 gap-3", showList && "lg:grid-cols-[minmax(0,1fr)_22rem]")}>
        <div className="relative min-h-0 overflow-hidden rounded-2xl border bg-muted/30 max-lg:h-[70dvh]">
          <iframe
            key={run}
            ref={frame}
            title={site.title}
            src={site.frame}
            allow="fullscreen"
            onLoad={() => send({ type: "hello" })}
            className="block size-full border-0"
          />
          {site.embed && !ready ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-end bg-muted/30">
              {site.poster ? <Image src={site.poster} alt="" fill unoptimized className="object-cover opacity-90" /> : null}
              {slow ? (
                <p className="relative m-4 rounded-lg bg-background/90 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                  The site is taking a while to answer. It may still be loading, or you can open it in its own tab.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {showList ? (
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/60">
          <p className="border-b px-4 py-3 text-sm text-muted-foreground">
            {!site.embed
              ? "The pieces this site is built from."
              : inspect
                ? "Point at the page to see which piece is which. Click selects it here, double-click opens it, Escape leaves."
                : "Turn on Inspect, then point at the page to see which piece is which."}
          </p>
          <p aria-live="polite" className="sr-only">
            {selectedPiece ? `Selected ${selectedPiece.title}` : ""}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <PieceGroup title="Components" pieces={listed} selected={selected} />
            {unlisted.length ? <PieceGroup title="Simple pieces of this site" pieces={unlisted} selected={selected} className="mt-5" /> : null}
          </div>
        </aside>
        ) : null}
      </div>
    </div>
  )
}

function PieceGroup({ title, pieces, selected, className }: { title: string; pieces: SitePiece[]; selected: string | null; className?: string }) {
  if (!pieces.length) return null
  return (
    <section className={className} aria-label={title}>
      <h2 className="px-1 pb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{title}</h2>
      <ul className="space-y-3">
        {pieces.map((piece) => (
          <li key={piece.name}>
            <SitePieceCard piece={piece} selected={selected === piece.name} />
          </li>
        ))}
      </ul>
    </section>
  )
}
