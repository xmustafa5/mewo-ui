import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { CATALOG, DEFAULT_BACKGROUND, findEntry, presetProps, themeDefaults } from "../catalog"
import { readDocument, sameValue, writeDocument } from "../params"
import type { Doc, Props, PropValue } from "../types"

const HISTORY_LIMIT = 80
/** Dragging a slider commits many values; edits to one prop this close together share one undo step. */
const COALESCE_MS = 700
const URL_DELAY = 160

type State = { doc: Doc; past: Doc[]; future: Doc[]; key: string | null; time: number }

type Action =
  | { type: "commit"; doc: Doc; key: string | null; time: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "replace"; doc: Doc }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "commit": {
      if (sameValue(action.doc, state.doc)) return state
      const coalesce = action.key !== null && state.key === action.key && action.time - state.time < COALESCE_MS
      return {
        doc: action.doc,
        past: coalesce ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        key: action.key,
        time: action.time,
      }
    }
    case "undo": {
      if (!state.past.length) return state
      return {
        doc: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
        key: null,
        time: 0,
      }
    }
    case "redo": {
      if (!state.future.length) return state
      return {
        doc: state.future[0],
        past: [...state.past, state.doc],
        future: state.future.slice(1),
        key: null,
        time: 0,
      }
    }
    case "replace":
      return sameValue(action.doc, state.doc) ? state : { ...state, doc: action.doc, key: null, time: 0 }
  }
}

const initialState = (params: { get(name: string): string | null }): State => ({
  doc: readDocument(params, DEFAULT_BACKGROUND, findEntry),
  past: [],
  future: [],
  key: null,
  time: 0,
})

/**
 * The document being edited: which background, which preset, which props differ. It lives in the URL too, so
 * a link reproduces the exact look, and it keeps an undo history.
 */
export function useStudioState() {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const light = resolvedTheme === "light"
  const [store, dispatch] = useReducer(reducer, searchParams, initialState)
  const { doc } = store
  const entry = findEntry(doc.id) ?? (findEntry(DEFAULT_BACKGROUND) as NonNullable<ReturnType<typeof findEntry>>)
  const written = useRef<string | null>(null)

  const defaults = useMemo(() => themeDefaults(entry, light), [entry, light])
  const layer = useMemo(() => presetProps(entry, doc.preset), [entry, doc.preset])
  const base = useMemo(() => ({ ...defaults, ...layer }), [defaults, layer])
  const props = useMemo(() => ({ ...base, ...doc.changes }), [base, doc.changes])

  const latest = useRef({ doc, base })
  useEffect(() => {
    latest.current = { doc, base }
  })

  const commit = useCallback((next: Doc, key: string | null = null) => {
    dispatch({ type: "commit", doc: next, key, time: performance.now() })
  }, [])

  const setProp = useCallback(
    (name: string, value: PropValue) => {
      const { doc: current, base: currentBase } = latest.current
      const changes: Props = { ...current.changes }
      if (sameValue(value, currentBase[name])) delete changes[name]
      else changes[name] = value
      commit({ ...current, changes }, `${current.id}:${name}`)
    },
    [commit],
  )

  const applyPreset = useCallback(
    (value: string) => {
      commit({ id: latest.current.doc.id, preset: value, changes: {} })
    },
    [commit],
  )

  const reset = useCallback(() => {
    commit({ id: latest.current.doc.id, preset: null, changes: {} })
  }, [commit])

  const selectBackground = useCallback(
    (id: string) => {
      if (!findEntry(id) || id === latest.current.doc.id) return
      commit({ id, preset: null, changes: {} })
    },
    [commit],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = CATALOG.findIndex((item) => item.id === latest.current.doc.id)
      const next = CATALOG[(index + direction + CATALOG.length) % CATALOG.length]
      selectBackground(next.id)
    },
    [selectBackground],
  )

  const undo = useCallback(() => dispatch({ type: "undo" }), [])
  const redo = useCallback(() => dispatch({ type: "redo" }), [])

  // Write the document to the URL, a beat after the last change. `replaceState` keeps the history clean and
  // Next's router picks the change up, so `useSearchParams` below sees it and knows to ignore it.
  useEffect(() => {
    const text = writeDocument(doc, entry).toString()
    if (text === window.location.search.replace(/^\?/, "")) {
      written.current = text
      return
    }
    const timer = window.setTimeout(() => {
      written.current = text
      window.history.replaceState(null, "", `${window.location.pathname}?${text}`)
    }, URL_DELAY)
    return () => window.clearTimeout(timer)
  }, [doc, entry])

  // A URL change the studio did not write (a link into the studio, back/forward) replaces the document.
  useEffect(() => {
    const text = searchParams.toString()
    if (text === written.current) return
    const incoming = readDocument(searchParams, DEFAULT_BACKGROUND, findEntry)
    const first = written.current === null
    written.current = text
    if (first) return
    queueMicrotask(() => dispatch({ type: "replace", doc: incoming }))
  }, [searchParams])

  return {
    entry,
    doc,
    light,
    defaults,
    props,
    activePreset: doc.preset,
    changedCount: Object.keys(doc.changes).length,
    canReset: Boolean(doc.preset) || Object.keys(doc.changes).length > 0,
    canUndo: store.past.length > 0,
    canRedo: store.future.length > 0,
    setProp,
    applyPreset,
    reset,
    selectBackground,
    step,
    undo,
    redo,
  }
}

export type StudioState = ReturnType<typeof useStudioState>
