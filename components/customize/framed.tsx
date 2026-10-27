"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Values } from "./types"

/*
 * A section's preview runs in a frame of its own, as its demo page does, so the Customize panel on the page sends
 * the values into the frame: the page posts `values` on every change and whenever the frame asks (`ready`), and
 * the frame renders the section from the last values it got. Same origin both ways; every message is checked.
 */

const SOURCE = "mewo-customize"
type Message = { source: typeof SOURCE; type: "values"; values: Values } | { source: typeof SOURCE; type: "ready" }

const isMessage = (event: MessageEvent): event is MessageEvent<Message> =>
  event.origin === window.location.origin && !!event.data && typeof event.data === "object" && (event.data as { source?: unknown }).source === SOURCE

// the frame side: the last values received, as a store
let received: Values | null = null
const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  const onMessage = (event: MessageEvent) => {
    if (!isMessage(event) || event.data.type !== "values") return
    received = event.data.values
    listeners.forEach((fn) => fn())
  }
  if (listeners.size === 1) window.addEventListener("message", onMessage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("message", onMessage)
  }
}

/** In the frame: the values the page sent, over the defaults. Asks the page for them once mounted. */
export function useFramedValues<T extends Values>(defaults: T): T {
  const values = React.useSyncExternalStore(
    subscribe,
    () => received,
    () => null,
  )
  React.useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ source: SOURCE, type: "ready" } satisfies Message, window.location.origin)
  }, [])
  return { ...defaults, ...(values ?? {}) } as T
}

/** On the page: the frame showing `/preview/<name>/customize`, fed the values; `run` reloads it. */
export function FramedPreview({ name, values, run, className }: { name: string; values: Values; run: number; className?: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null)
  const send = React.useCallback((target: HTMLIFrameElement | null, next: Values) => {
    target?.contentWindow?.postMessage({ source: SOURCE, type: "values", values: next } satisfies Message, window.location.origin)
  }, [])

  // on every change, and again whenever the frame says it is ready (its first paint, a reload)
  React.useEffect(() => {
    send(ref.current, values)
  }, [send, values])
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (isMessage(event) && event.data.type === "ready" && event.source === ref.current?.contentWindow) send(ref.current, values)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [send, values])

  return (
    <iframe
      key={run}
      ref={ref}
      title={`${name} preview`}
      src={`/preview/${name}/customize`}
      onLoad={(event) => send(event.currentTarget, values)}
      className={cn("h-160 w-full rounded-xl border bg-background shadow-xl shadow-black/10", className)}
    />
  )
}
