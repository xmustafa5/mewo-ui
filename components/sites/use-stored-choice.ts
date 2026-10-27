"use client"

import * as React from "react"

const EVENT = "mewo:stored-choice"
// a choice made where storage is blocked (a private window) still holds for the page
const memory = new Map<string, string>()

/**
 * A visitor's choice among a few values, remembered in local storage. The server and the first client render use
 * the fallback, so nothing mismatches; the stored value shows right after hydration.
 */
export function useStoredChoice<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (next: T) => void] {
  const subscribe = React.useCallback((listener: () => void) => {
    window.addEventListener("storage", listener)
    window.addEventListener(EVENT, listener)
    return () => {
      window.removeEventListener("storage", listener)
      window.removeEventListener(EVENT, listener)
    }
  }, [])
  const read = React.useCallback((): T => {
    let value = memory.get(key) ?? null
    try {
      value ??= window.localStorage.getItem(key)
    } catch {}
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
  }, [key, fallback, allowed])
  const value = React.useSyncExternalStore(subscribe, read, () => fallback)
  const set = React.useCallback(
    (next: T) => {
      memory.set(key, next)
      try {
        window.localStorage.setItem(key, next)
      } catch {}
      window.dispatchEvent(new Event(EVENT))
    },
    [key]
  )
  return [value, set]
}
