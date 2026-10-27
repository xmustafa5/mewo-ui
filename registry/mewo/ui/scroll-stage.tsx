"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/** One keyframe: [scroll position in viewport heights, centre x (vw %), centre y (vh %), scale, opacity?]. */
export type StageKey = [number, number, number, number, number?]

/** An element's motion: its layout size where it was measured, its keyframes, and windows where it fades by time. */
export type StageTrack = { size: [number, number]; keys?: StageKey[]; on?: [number, number][] }

/** Every element's track for one layout; `_meta` is the viewport the set was measured at. */
export type StageTrackSet = Record<string, StageTrack> & { _meta?: { vw: number; vh: number } }

export type StageLayout = "desktop" | "tablet" | "phone"

export type StageState = {
  /** Scroll position in viewport heights. */
  progress: number
  /** Scroll speed in viewport heights per second. */
  velocity: number
  layout: StageLayout
  reducedMotion: boolean
  /** The stage is mirrored left to right (a right-to-left page). */
  mirror: boolean
}

const QUERIES: Record<StageLayout, string> = {
  desktop: "(min-width: 901px)",
  tablet: "(max-width: 900px) and (min-aspect-ratio: 13/20)",
  phone: "(max-width: 900px) and (max-aspect-ratio: 13/20)",
}

// The state lives outside React: the stage writes it on every scroll update, components read only what they select.
// Each stage has its own store, so several stages on one page (demos in frames) don't mix; a stage that follows the
// page's scroll also is the page's store, which getScrollStage reads.
type StageStore = { state: StageState; listeners: Set<() => void> }
const createStore = (): StageStore => ({
  state: { progress: 0, velocity: 0, layout: "desktop", reducedMotion: false, mirror: false },
  listeners: new Set(),
})
const pageStore = createStore()
const emit = (store: StageStore) => store.listeners.forEach((l) => l())
const setStage = (store: StageStore, patch: Partial<StageState>, notify = true) => {
  store.state = { ...store.state, ...patch }
  if (notify) emit(store)
}

/** The page's stage state, for frame loops outside React (a WebGL layer, say). */
export function getScrollStage() {
  return pageStore.state
}

const StoreContext = React.createContext<StageStore | null>(null)

/** Selects from the nearest stage's state; re-renders only when the selected value changes (select primitives). */
export function useScrollStage<T>(select: (s: StageState) => T): T {
  const store = React.useContext(StoreContext) ?? pageStore
  const subscribe = React.useCallback(
    (l: () => void) => {
      store.listeners.add(l)
      return () => {
        store.listeners.delete(l)
      }
    },
    [store]
  )
  return React.useSyncExternalStore(subscribe, () => select(store.state), () => select(store.state))
}

/** True inside a ScrollStage: blocks lay their pieces out for the stage, and in normal flow elsewhere. */
export function useInScrollStage() {
  return React.useContext(StoreContext) !== null
}

/** A track's values at scroll position v, linearly between keys: [cx, cy, scale, opacity] into out. */
export function sampleKeys(keys: StageKey[], v: number, out: number[]) {
  let a = keys[0]!
  let b = keys[0]!
  let t = 0
  const last = keys[keys.length - 1]!
  if (v >= last[0]) {
    a = last
    b = last
  } else if (v > a[0]) {
    let lo = 0
    let hi = keys.length - 1
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1
      if (keys[m]![0] <= v) lo = m
      else hi = m
    }
    a = keys[lo]!
    b = keys[hi]!
    t = (v - a[0]) / (b[0] - a[0])
  }
  for (let i = 1; i <= 4; i++) {
    const x = a[i] ?? 1
    const y = b[i] ?? 1
    out[i - 1] = x + (y - x) * t
  }
  return out
}

// Tracked pieces sit at the stage's top left and are moved by translate + scale. Until the stage is ready, and when
// the layout has no track for them, they stay hidden. Pieces with time-based fades (data-timed) fade when the stage
// sets data-on; story text marked data-entrance fades out first, then fades in while growing from 0.9 (fast at
// first, then ever slower over five seconds), so two texts in one place never overlap.
const STAGE = [
  "pointer-events-none fixed inset-0 overflow-hidden",
  "[&_[data-track]]:absolute [&_[data-track]]:top-0 [&_[data-track]]:left-0 [&_[data-track]]:origin-center [&_[data-track]]:will-change-transform",
  "[&:not([data-ready])_[data-track]]:invisible [&_[data-untracked]]:invisible",
  "[&_[data-timed]]:invisible [&_[data-timed]]:opacity-0 [&_[data-timed]]:[transition:opacity_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s_linear_0.8s]",
  "[&_[data-timed][data-on]]:visible [&_[data-timed][data-on]]:opacity-100 [&_[data-timed][data-on]]:[transition:opacity_0.8s_cubic-bezier(0.455,0.03,0.515,0.955),visibility_0s]",
  "[&_[data-timed][data-entrance]]:scale-90 [&_[data-timed][data-entrance]]:[transition:opacity_0.22s_ease-in,scale_0s_linear_0.22s,visibility_0s_linear_0.22s]",
  "[&_[data-timed][data-entrance][data-on]]:scale-100 [&_[data-timed][data-entrance][data-on]]:[transition:opacity_1.2s_cubic-bezier(0.215,0.61,0.355,1)_0.25s,scale_5s_cubic-bezier(0.19,1,0.22,1)_0.25s,visibility_0s]",
].join(" ")

type Bound = {
  el: HTMLElement
  track: StageTrack
  w: number
  h: number
  x: number
  y: number
  s: number
  parent?: Bound
  below?: Bound
  last: string
}

// Two pieces for the demo: a title that rises and shrinks, and a caption that fades in by time.
const DEMO_TRACKS: Partial<Record<StageLayout, StageTrackSet>> = {
  desktop: {
    title: { size: [600, 120], keys: [[0, 50, 50, 1, 1], [1, 50, 25, 0.6, 1], [2, 50, 10, 0.4, 0]] },
    caption: { size: [500, 60], keys: [[0, 50, 70, 1]], on: [[0.4, 1.6]] },
  },
}

export interface ScrollStageProps extends React.ComponentProps<"div"> {
  /** Keyframe tracks per layout (desktop above 900px, tablet and phone below it, split at an aspect of 13/20). */
  tracks?: Partial<Record<StageLayout, StageTrackSet>>
  /** Length of the story in viewport heights; the page itself must be at least this tall. */
  length?: number
  /** Media queries that choose each layout's track set. */
  queries?: Partial<Record<StageLayout, string>>
  /** Mirror every piece left to right, for right-to-left pages: a text on the left of the picture moves to its right. */
  mirror?: boolean
  /** An element that scrolls instead of the page (a demo's box): the stage follows its scroll, and measures its own box
   * instead of the window. Hold the stage inside a size-contained box (`container-type: size` and `contain: layout`) so `fixed` keeps it there. */
  scroller?: React.RefObject<HTMLElement | null>
  /** Use this layout's tracks whatever the window (a demo frame shows the desktop story at any width). */
  layout?: StageLayout
}

/**
 * A fixed stage whose pieces (`data-track="<name>"`) move, scale and fade by scroll position, replaying keyframe
 * tracks. Pieces can also fade by time inside `on` windows, sit under another piece (`data-track-below`), keep their
 * top edge (`data-track-anchor="top"`) or move inside a parent piece (`data-track-rel`). Writes `--s` (the scale) so
 * CSS can shade a picture as it zooms.
 */
export function ScrollStage({ tracks = DEMO_TRACKS, length = 3, queries, mirror = false, scroller, layout: forced, className, children, ...props }: ScrollStageProps) {
  const root = React.useRef<HTMLDivElement>(null)
  const [ownStore] = React.useState(createStore)
  const store = scroller ? ownStore : pageStore

  // The stage works only when something happens: a scroll or a resize schedules one frame that moves every piece,
  // and nothing runs between events, on screen or off.
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    setStage(store, { reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, mirror }, false)
    const scrollerEl = scroller?.current ?? null
    const target: EventTarget = scrollerEl ?? window
    // the stage's box: the window's, or (following a scroller) its own
    const W = () => (scrollerEl ? el.clientWidth : window.innerWidth)
    const H = () => (scrollerEl ? el.clientHeight : window.innerHeight)
    // the scroll position in viewport heights, held inside the story
    const position = () => Math.min(length, Math.max(0, (scrollerEl ? scrollerEl.scrollTop : window.scrollY) / Math.max(1, H())))

    let alive = true
    const setup = (layout: StageLayout) => {
      setStage(store, { layout })
      const set = tracks[layout] ?? tracks.desktop ?? {}
      const traceVh = set._meta?.vh || 900
      const bound: Bound[] = []
      for (const node of el.querySelectorAll<HTMLElement>("[data-track]")) {
        const track = set[node.dataset.track!] as StageTrack | undefined
        node.toggleAttribute("data-untracked", !track)
        if (!track) continue
        node.toggleAttribute("data-timed", !!track.on)
        const b: Bound = { el: node, track, w: 0, h: 0, x: 0, y: 0, s: 1, last: "" }
        if (node.dataset.trackRel) b.parent = bound.find((p) => p.el === node.parentElement?.closest("[data-track]"))
        if (node.dataset.trackBelow) b.below = bound.find((p) => p.el.dataset.track === node.dataset.trackBelow)
        bound.push(b)
      }
      const measure = () => {
        for (const b of bound) {
          b.w = b.el.offsetWidth
          b.h = b.el.offsetHeight
          b.last = ""
        }
      }
      const v4 = [0, 0, 1, 1]
      const apply = (v: number) => {
        const vw = W() / 100
        const vh = H() / 100
        for (const b of bound) {
          if (!b.track.keys) continue
          sampleKeys(b.track.keys, v, v4)
          const [cx, cy, s, o] = v4 as [number, number, number, number]
          let x = (mirror ? 100 - cx : cx) * vw - b.w / 2
          let y = cy * vh - b.h / 2
          if (b.el.dataset.trackAnchor === "top") y = cy * vh - (b.track.size[1] * s * (H() / traceVh)) / 2
          // a credit under a picture whose box is sized in vw: a measured vh position would land on it at other aspects
          if (b.below) y = b.below.y + (b.below.h * (1 + b.below.s)) / 2 + vh
          b.x = x
          b.y = y
          b.s = s
          if (b.parent) {
            x -= b.parent.x
            y -= b.parent.y
          }
          const key = `${x.toFixed(1)}|${y.toFixed(1)}|${s.toFixed(4)}|${o.toFixed(3)}`
          if (key === b.last) continue
          b.last = key
          // position through `translate`, so a CSS `scale` on the piece (the text entrance) scales it about its centre
          b.el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
          b.el.style.transform = `scale(${s.toFixed(4)})`
          b.el.style.setProperty("--s", s.toFixed(4))
          if (b.track.keys[0]!.length > 4) {
            b.el.style.opacity = o.toFixed(3)
            b.el.style.visibility = o < 0.002 ? "hidden" : "visible"
          }
        }
      }
      // a timed piece is on while the position is inside one of its windows; the CSS fades do the rest
      const timed = bound.filter((b) => b.track.on)
      const toggle = (v: number) => {
        for (const b of timed) b.el.toggleAttribute("data-on", b.track.on!.some(([from, to]) => v >= from && v < to))
      }

      let last = position()
      let lastAt = performance.now()
      let frame = 0
      let still = 0
      const update = () => {
        frame = 0
        const now = performance.now()
        const v = position()
        const dt = Math.max(1 / 240, (now - lastAt) / 1000)
        setStage(store, { progress: v, velocity: (v - last) / dt }, false)
        last = v
        lastAt = now
        apply(v)
        toggle(v)
        emit(store)
        // the speed reads 0 once the scroll has stopped
        window.clearTimeout(still)
        still = window.setTimeout(() => setStage(store, { velocity: 0 }), 150)
      }
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update)
      }
      const refresh = () => {
        measure()
        const v = position()
        apply(v)
        toggle(v)
      }
      let active = true
      refresh()
      setStage(store, { progress: last }, false)
      el.setAttribute("data-ready", "")
      target.addEventListener("scroll", schedule, { passive: true })
      window.addEventListener("resize", refresh)
      const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh)
      resize?.observe(el)
      document.fonts?.ready.then(() => alive && active && refresh())
      return () => {
        active = false
        target.removeEventListener("scroll", schedule)
        window.removeEventListener("resize", refresh)
        resize?.disconnect()
        if (frame) cancelAnimationFrame(frame)
        window.clearTimeout(still)
        el.removeAttribute("data-ready")
      }
    }

    let teardown: (() => void) | null = null
    const start = (layout: StageLayout) => {
      teardown?.()
      teardown = setup(layout)
    }
    if (forced) {
      start(forced)
      return () => {
        alive = false
        teardown?.()
      }
    }
    // the layout follows the media queries, as the tracks were measured per layout
    const media = Object.fromEntries(Object.entries({ ...QUERIES, ...queries }).map(([key, query]) => [key, window.matchMedia?.(query) ?? null])) as Record<
      StageLayout,
      MediaQueryList | null
    >
    const pick = (): StageLayout => (media.desktop?.matches ? "desktop" : media.tablet?.matches ? "tablet" : "phone")
    let current = pick()
    start(current)
    const onChange = () => {
      const next = pick()
      if (next === current) return
      current = next
      start(next)
    }
    const lists = Object.values(media).filter((m): m is MediaQueryList => !!m)
    lists.forEach((m) => m.addEventListener?.("change", onChange))
    return () => {
      alive = false
      lists.forEach((m) => m.removeEventListener?.("change", onChange))
      teardown?.()
    }
  }, [tracks, length, queries, mirror, scroller, forced, store])

  return (
    <StoreContext.Provider value={store}>
      <div ref={root} data-slot="scroll-stage" className={cn(STAGE, className)} {...props}>
        {children}
      </div>
    </StoreContext.Provider>
  )
}
