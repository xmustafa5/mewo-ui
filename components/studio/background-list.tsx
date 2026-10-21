"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATALOG, matchesQuery } from "./catalog"
import { useScrollEdges } from "./hooks/use-scroll-edges"
import type { StudioEntry } from "./types"

function Thumb({ entry }: { entry: StudioEntry }) {
  return (
    <span
      aria-hidden
      className="h-8.5 w-13.5 shrink-0 rounded-md border border-foreground/10"
      style={{ background: `linear-gradient(135deg, ${entry.swatch.join(", ")})` }}
    />
  )
}

export function BackgroundList({
  activeId,
  onSelect,
  autoFocus = false,
  onEscape,
}: {
  activeId: string
  onSelect: (id: string) => void
  autoFocus?: boolean
  onEscape?: () => void
}) {
  const [query, setQuery] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => CATALOG.filter((entry) => matchesQuery(entry, query)), [query])
  const edges = useScrollEdges(listRef)
  const placed = useRef(false)

  // Keep the active item in view: centred on first show, then nudged just enough as the selection moves.
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!list || !active) return
    const top = active.offsetTop - list.offsetTop
    const bottom = top + active.offsetHeight
    if (!placed.current) {
      placed.current = true
      list.scrollTop = Math.max(0, top - (list.clientHeight - active.offsetHeight) / 2)
    } else if (top < list.scrollTop + 8) list.scrollTop = Math.max(0, top - 8)
    else if (bottom > list.scrollTop + list.clientHeight - 8) list.scrollTop = bottom - list.clientHeight + 8
  }, [activeId, items])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && items[0]) {
      event.preventDefault()
      onSelect(items[0].id)
    } else if (event.key === "Escape") {
      if (query) {
        event.stopPropagation()
        setQuery("")
      } else {
        onEscape?.()
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Search ${CATALOG.length} backgrounds`}
          aria-label="Search backgrounds"
          spellCheck={false}
          autoComplete="off"
          autoFocus={autoFocus}
          className="h-9 w-full rounded-xl border bg-background/60 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </label>
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
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-card to-transparent transition-opacity",
            edges.bottom && "opacity-0",
          )}
        />
        <div
          ref={listRef}
          className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1 py-1 scrollbar-thin"
        >
          {items.map((entry) => {
            const active = entry.id === activeId
            return (
              <button
                key={entry.id}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(entry.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl p-1.5 pr-2.5 text-left text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Thumb entry={entry} />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              </button>
            )
          })}
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">Nothing matches “{query.trim()}”.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
