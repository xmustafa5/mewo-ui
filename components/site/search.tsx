"use client"

import * as React from "react"
import Link from "next/link"
import { Dialog } from "@base-ui/react/dialog"
import { CornerDownLeft, Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type SearchEntry = { href: string; title: string; section: string; description?: string }

export function filterEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return entries
  return entries.filter((entry) =>
    [entry.title, entry.section, entry.description ?? ""].some((field) => field.toLowerCase().includes(needle))
  )
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

/** The header's search: opens on click, on "/" and on Cmd/Ctrl+K; arrows move, Enter opens. */
export function Search({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([])
  const results = filterEntries(entries, query)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)
      if (shortcut || (event.key === "/" && !isTypingTarget(event.target))) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery("")
      setActive(0)
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (results.length === 0) return
      const step = event.key === "ArrowDown" ? 1 : -1
      const next = (active + step + results.length) % results.length
      setActive(next)
      linkRefs.current[next]?.scrollIntoView({ block: "nearest" })
    } else if (event.key === "Enter") {
      event.preventDefault()
      linkRefs.current[active]?.click()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger
        aria-label="Search components"
        className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-56"
      >
        <SearchIcon className="size-4" aria-hidden />
        <span className="max-sm:hidden">Search…</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 font-mono text-[11px] max-sm:hidden">/</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-[12vh] left-1/2 z-50 w-[min(600px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-black/40 transition-[opacity,transform] duration-150 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <Dialog.Title className="sr-only">Search components</Dialog.Title>
          <div className="flex items-center gap-3 border-b px-4">
            <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search components and docs…"
              aria-label="Search components and docs"
              className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-background px-1.5 font-mono text-[11px] text-muted-foreground">Esc</kbd>
          </div>
          {results.length > 0 ? (
            <ul className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
              {results.map((entry, index) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    ref={(element) => {
                      linkRefs.current[index] = element
                    }}
                    data-active={index === active || undefined}
                    onMouseMove={() => setActive(index)}
                    onClick={() => changeOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none",
                      "data-[active]:bg-accent data-[active]:text-accent-foreground"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{entry.title}</span>
                      {entry.description ? (
                        <span className="block truncate text-xs text-muted-foreground">{entry.description}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{entry.section}</span>
                    <CornerDownLeft
                      className={cn("size-3.5 shrink-0 text-muted-foreground", index !== active && "invisible")}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
