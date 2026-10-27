"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import type { Primitive, Values } from "./types"
import { readSearch, useSearch, writeSearch } from "./url-state"

const HEX = /^#?[0-9a-f]{3,8}$/i
const isHex = (value: unknown): value is string => typeof value === "string" && HEX.test(value)
const isHexDefault = (value: unknown): value is string => typeof value === "string" && value.startsWith("#") && isHex(value)

/** Two values are the same when they print the same: lists by their items. */
export const same = (a: unknown, b: unknown) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b)

/** A value as it travels in the address: a colour loses its `#`, a list is comma-joined. */
export function serialize(value: Primitive): string {
  if (Array.isArray(value)) return value.map((item) => (isHex(item) ? item.replace(/^#/, "") : item)).join(",")
  if (isHexDefault(value)) return value.slice(1)
  return String(value)
}

/** A value read back from the address, typed by its default. */
export function parse(text: string, fallback: Primitive): Primitive {
  if (Array.isArray(fallback)) return text === "" ? [] : text.split(",").map((item) => (isHex(item) && !item.startsWith("#") ? `#${item}` : item))
  if (typeof fallback === "number") {
    const number = Number(text)
    return text !== "" && Number.isFinite(number) ? number : fallback
  }
  if (typeof fallback === "boolean") return text === "true"
  if (isHexDefault(fallback)) return isHex(text) ? `#${text.replace(/^#/, "")}` : text
  return text
}

const noSubscribe = () => () => {}

/** True once the client knows the theme and it is light; false on the server and until then, like `ByTheme`. */
export function useIsLight() {
  const { resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  return mounted && resolvedTheme === "light"
}

export type Customize<T extends Values> = {
  /** The current values: the defaults under what the address holds. */
  values: T
  /** The defaults in force: the light-mode table merged in when the theme is light. */
  defaults: T
  /** Whether the address holds anything: Reset shows only then. */
  changed: boolean
  /** Bumps when the preview should remount: Replay, a control marked `replay`, a preset. Key the preview on it. */
  run: number
  /** Sets one value. A value equal to its default leaves the address. `replay` remounts the preview too. */
  set: <K extends keyof T & string>(key: K, value: T[K], options?: { replay?: boolean }) => void
  /** Sets several values at once: a preset. */
  setMany: (patch: Partial<T>, options?: { replay?: boolean }) => void
  reset: () => void
  replay: () => void
}

/**
 * The state behind a piece's Customize panel, kept in the address: each control is a query parameter, present
 * only while it differs from its default, so `?duration=3` is the whole customised look and a plain address is
 * the defaults. `light` holds the defaults that change in the light theme (a colour tuned for a dark page), the
 * way the by-theme demos pass one configuration per theme: a value still at its default follows the theme.
 */
export function useCustomize<T extends Values>(defaults: T, options: { light?: Partial<T> } = {}): Customize<T> {
  const search = useSearch()
  const light = useIsLight()
  const lightTable = options.light
  const effective = React.useMemo(() => (light && lightTable ? { ...defaults, ...lightTable } : defaults), [defaults, light, lightTable])

  const stored = React.useMemo(() => {
    const params = new URLSearchParams(search)
    const out: Values = {}
    for (const key of Object.keys(defaults)) {
      const text = params.get(key)
      if (text !== null) out[key] = parse(text, defaults[key])
    }
    return out as Partial<T>
  }, [search, defaults])

  const values = React.useMemo(() => ({ ...effective, ...stored }), [effective, stored])
  const changed = Object.keys(stored).length > 0
  const [run, setRun] = React.useState(0)
  const replay = React.useCallback(() => setRun((count) => count + 1), [])

  const setMany = React.useCallback(
    (patch: Partial<T>, options: { replay?: boolean } = {}) => {
      const params = new URLSearchParams(readSearch())
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || same(value, effective[key])) params.delete(key)
        else params.set(key, serialize(value as Primitive))
      }
      writeSearch(params)
      if (options.replay) replay()
    },
    [effective, replay],
  )

  const set = React.useCallback(<K extends keyof T & string>(key: K, value: T[K], options?: { replay?: boolean }) => setMany({ [key]: value } as unknown as Partial<T>, options), [setMany])

  const reset = React.useCallback(() => {
    const params = new URLSearchParams(readSearch())
    for (const key of Object.keys(defaults)) params.delete(key)
    writeSearch(params)
  }, [defaults])

  return { values, defaults: effective, changed, run, set, setMany, reset, replay }
}
