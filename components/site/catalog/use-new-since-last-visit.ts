"use client"

import { useEffect, useSyncExternalStore } from "react"

/** Every item name the visitor has seen in the catalog, kept between visits. */
const SEEN_KEY = "mewo:catalog-seen"
/** What was new when this visit began, so the badges hold still for the whole visit. */
const VISIT_KEY = "mewo:catalog-new"

const EMPTY: ReadonlySet<string> = new Set()
let cache: { key: string; value: ReadonlySet<string> } | null = null

const readList = (storage: Storage, key: string): string[] => {
  try {
    const value = JSON.parse(storage.getItem(key) ?? "[]")
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function discover(names: string[]): ReadonlySet<string> {
  try {
    const pinned = readList(window.sessionStorage, VISIT_KEY)
    if (pinned.length > 0) return new Set(pinned)
    const seen = readList(window.localStorage, SEEN_KEY)
    // A first visit has nothing to compare with, so nothing is "new since last time".
    if (seen.length === 0) return EMPTY
    const known = new Set(seen)
    const fresh = names.filter((name) => !known.has(name))
    window.sessionStorage.setItem(VISIT_KEY, JSON.stringify(fresh))
    return new Set(fresh)
  } catch {
    return EMPTY
  }
}

const subscribe = () => () => {}

/**
 * The items added since this visitor last opened the catalog. Empty on the server and on a first visit, so
 * the server markup and the first client render agree; the badges appear right after hydration.
 */
export function useNewSinceLastVisit(names: string[]): ReadonlySet<string> {
  const key = names.join("|")
  const value = useSyncExternalStore(
    subscribe,
    () => {
      if (cache?.key !== key) cache = { key, value: discover(names) }
      return cache.value
    },
    () => EMPTY,
  )

  // Remember the whole catalog as seen, for next time.
  useEffect(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(key ? key.split("|") : []))
    } catch {
      // Storage blocked: every visit is a first visit.
    }
  }, [key])

  return value
}
