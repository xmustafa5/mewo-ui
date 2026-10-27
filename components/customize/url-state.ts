import { useSyncExternalStore } from "react"

/**
 * The address's query string as a store. A customised look lives in the URL, so it survives a reload and can be
 * sent as a link. Writes show at once and reach the browser's history a moment later: Safari caps
 * `replaceState` at about a hundred calls per half minute, which a scrubbed slider would pass in seconds.
 */

const FLUSH_MS = 120
const RETRY_MS = 600

/** What was written but not yet given to the browser, or null when the address is up to date. */
let pending: string | null = null
/** The page the pending write belongs to: a write never lands on the page navigated to meanwhile. */
let pendingPath = ""
let timer = 0
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

function current(): string {
  if (typeof window === "undefined") return ""
  if (pending !== null && pendingPath !== window.location.pathname) pending = null
  return pending ?? window.location.search
}

function commit() {
  timer = 0
  if (pending === null) return
  if (pendingPath !== window.location.pathname) {
    pending = null
    return
  }
  try {
    window.history.replaceState(window.history.state, "", `${pendingPath}${pending}${window.location.hash}`)
    pending = null
  } catch {
    // the browser's rate limit: keep the value and try again later
    timer = window.setTimeout(commit, RETRY_MS)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener("popstate", notify)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("popstate", notify)
  }
}

/** The query string (`?a=1` or ``), re-rendering on every write and on back and forward. Empty on the server. */
export function useSearch(): string {
  return useSyncExternalStore(subscribe, current, () => "")
}

/** The query string right now, pending writes included: the base for the next write. */
export const readSearch = current

/** Replaces the query string. Subscribers re-render at once; the address follows shortly. */
export function writeSearch(params: URLSearchParams) {
  const text = params.toString()
  pending = text ? `?${text}` : ""
  pendingPath = window.location.pathname
  notify()
  window.clearTimeout(timer)
  timer = window.setTimeout(commit, FLUSH_MS)
}
