"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ConcaveCarouselItem {
  /** Image URL. It is cropped to fill its panel, like `object-fit: cover`. */
  src: string
  /** Image description for screen readers. */
  alt: string
  /** First caption line, under the panel. Also names the panel for screen readers. */
  title?: string
  /** Second caption line. */
  subtitle?: string
  /** Clicking the centred image, or pressing Enter, navigates here. */
  href?: string
}

/** What `controlsRef` receives. */
export interface ConcaveCarouselControls {
  /** Turn the wall one panel forward. */
  next: () => void
  /** Turn the wall one panel back. */
  previous: () => void
  /** Turn the wall the short way round to the panel at `index`. */
  goTo: (index: number) => void
}

export interface ConcaveCarouselProps extends Omit<React.ComponentProps<"div">, "children" | "onSelect" | "draggable"> {
  /** Images hung around the wall, in order. */
  items?: ConcaveCarouselItem[]
  /** Index of the image that starts in the centre. */
  startIndex?: number
  /** Width / height of every panel. Images are cropped to fill it. */
  aspect?: number
  /** Height of the centred panel as a fraction of the space above the caption. */
  size?: number
  /** How strongly the wall bends around the viewer: 0 is a flat strip, 1 a tight drum. */
  curvature?: number
  /** Viewer distance from the wall, in panel heights. */
  distance?: number
  /** Viewing angle in degrees. Negative looks up at the wall, positive looks down at the floor. */
  tilt?: number
  /** Space between panels in pixels, at the centred panel. */
  gap?: number
  /** Corner radius in pixels, at the centred panel. */
  radius?: number
  /** Opacity of the floor reflection. 0 removes it. */
  reflection?: number
  /** How much the wall fades toward the left and right edges, 0 to 1. */
  dim?: number
  /** drift: turn slowly and continuously. step: one panel every `interval`. off: stay still. */
  autoplay?: "drift" | "step" | "off"
  /** Drift speed in panels per second. Negative turns the other way (also for step). */
  speed?: number
  /** Seconds between steps when autoplay is "step". */
  interval?: number
  /** Settle with a panel centred after a drag, flick or scroll. */
  snap?: boolean
  /** How far a flick carries the wall, 0 to 1. */
  inertia?: number
  /** Brake the motion while the pointer rests on the wall. */
  pauseOnHover?: boolean
  /** Drag or flick the wall to turn it. */
  draggable?: boolean
  /** Scroll to turn the wall, one panel per notch. */
  wheel?: boolean
  /** Show each panel's title and subtitle under it. */
  captions?: boolean
  /** Previous and next buttons with a counter. */
  controls?: boolean
  /** Any CSS background for the root. Leave it unset for a transparent root. */
  backgroundColor?: string
  /** Stops autoplay. Space toggles it too. */
  paused?: boolean
  /** Called with the centred image's index whenever it changes. */
  onIndexChange?: (index: number) => void
  /** The centred image was clicked, or Enter was pressed. */
  onSelect?: (item: ConcaveCarouselItem, index: number) => void
  /** Receives `next`, `previous` and `goTo`. The root's own `ref` stays the consumer's. */
  controlsRef?: React.Ref<ConcaveCarouselControls>
}

const DEFAULT_ITEMS: ConcaveCarouselItem[] = [
  ["Harbour Light", "Morning on the water"],
  ["Paper Lanterns", "A street after rain"],
  ["Quiet Ridge", "Above the tree line"],
  ["Salt Road", "Flat white for miles"],
  ["Glass House", "Green behind every pane"],
  ["Night Ferry", "The last crossing"],
  ["Copper Field", "Late summer, low sun"],
  ["Still Water", "A lake with no wind"],
].map(([title, subtitle], index) => ({
  src: `https://picsum.photos/seed/mewo-concave-carousel-${index + 1}/800/640`,
  alt: "Placeholder photograph",
  title,
  subtitle,
}))

const DEFAULT_LABEL = "Curved gallery. Drag, scroll or use the arrow keys to turn it. Space pauses the motion."
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

// Each panel is drawn as vertical strips so it bends along the wall.
const STRIPS = 8
// Neighbouring strips overlap by this many pixels, which hides the seams between them.
const STRIP_OVERLAP = 0.8
// Snap spring: about 610ms to settle, about 1% overshoot.
const SPRING_K = 53.3
const SPRING_C = 12.4
// The spring is integrated in fixed substeps so a slow frame does not change its shape.
const SUBSTEP = 1 / 240
// Drift brakes and picks up again with these time constants, in seconds.
const BRAKE_TAU = 0.35
const ACCEL_TAU = 0.8
// Input holds the drift (and the next step) this long, in milliseconds; leaving the wall after a hover holds it this long.
const RESUME_AFTER_INPUT = 2400
const RESUME_AFTER_HOVER = 600
// Seconds of coasting per unit of inertia.
const COAST_TIME = 0.9
// Pixels of wheel delta per panel.
const WHEEL_STEP = 50
// Pixels a press travels before it becomes a drag.
const DRAG_THRESHOLD = 4
// Wall radius at curvature 1, in panel widths: radius = 1.16 × width ÷ curvature.
const CURVE_RADIUS = 1.16
// Viewer distance in centred-panel heights is VIEW_SLOPE × distance + VIEW_OFFSET.
// Distance 4 puts the viewer 4.17 heights away, distance 6 puts it 5.92 away.
const VIEW_SLOPE = 0.875
const VIEW_OFFSET = 0.67
// Pixels kept free under the wall for the captions and for the controls.
const CAPTION_RESERVE = 64
const CONTROLS_RESERVE = 59
// A caption sits this far under its panel's bottom edge, in centred-panel heights.
const CAPTION_OFFSET = 0.145
// The reflection starts this far under the panel, in panel heights, and this fraction of it fades in.
const REFLECT_GAP = 0.07
const REFLECT_LENGTH = 0.45
// Each frame's step is clamped to this range in seconds, so a hitch or a tab switch cannot fling the wall.
const MIN_DT = 1 / 240
const MAX_DT = 0.05

type Mode = "drift" | "spring" | "drag" | "coast"

type Live = {
  autoplay: "drift" | "step" | "off"
  speed: number
  interval: number
  paused: boolean
  reduced: boolean
  pauseOnHover: boolean
  snap: boolean
  inertia: number
  tilt: number
  gap: number
  captions: boolean
  items: ConcaveCarouselItem[]
  onIndexChange?: (index: number) => void
  onSelect?: (item: ConcaveCarouselItem, index: number) => void
}

const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
const pad = (value: number) => String(value).padStart(2, "0")

/** Wraps a slot's distance to the wall's position, in panels, into the loop [-slots / 2, slots / 2). */
export function wrapOffset(value: number, slots: number) {
  if (slots <= 0) return 0
  return mod(value + slots / 2, slots) - slots / 2
}

/** Whether a panel at wall angle `theta` can be seen: in front of the viewer, facing them, and on screen. */
export function facesViewer(theta: number, wallRadius: number, perspective: number, viewWidth: number, panelWidth: number) {
  if (Math.abs(theta) > Math.PI * 0.9) return false
  const x = wallRadius * Math.sin(theta)
  const z = wallRadius * (1 - Math.cos(theta))
  if (z > perspective * 0.92) return false
  // Its face points away from the viewer.
  if (wallRadius + (perspective - wallRadius) * Math.cos(theta) <= 0) return false
  return Math.abs((perspective * x) / (perspective - z)) < viewWidth / 2 + panelWidth
}

/**
 * The wall for a root of `width` × `height` pixels. Lengths are in pixels: `A` is the space above the caption,
 * `h` and `w` the centred panel, `R` the wall radius, `alpha` the wall angle per panel, `p` the viewer distance
 * (the CSS perspective), `cy` the wall's vertical centre, `sw` a strip's width, `strips` each strip's transform
 * inside its panel. `slots` is how many panels are hung: the items repeat until the point where the wall wraps
 * round is safely out of view.
 */
export function wallGeometry({
  width,
  height,
  count,
  size,
  aspect,
  curvature,
  gap,
  distance,
  captions,
  controls,
}: {
  width: number
  height: number
  count: number
  size: number
  aspect: number
  curvature: number
  gap: number
  distance: number
  captions: boolean
  controls: boolean
}) {
  const reserve = (captions ? CAPTION_RESERVE : 0) + (controls ? CONTROLS_RESERVE : 0)
  const A = Math.max(160, height - reserve)
  const h = Math.max(40, size * A)
  const w = h * aspect
  const n = Math.max(count, 1)
  const R = (CURVE_RADIUS * w) / clamp(curvature, 0.01, 1)
  // Neighbours sit `gap` apart along the arc.
  const alpha = (w + gap) / R
  const p = (VIEW_SLOPE * Math.max(1.2, distance) + VIEW_OFFSET) * h
  // How many panels away from the centre can still be seen.
  let reach = 0
  for (let o = 0; o < 64; o += 0.5) {
    if (!facesViewer(o * alpha, R, p, width, w)) break
    reach = o
  }
  const slots = n * Math.max(1, Math.ceil((2 * reach + 3) / n))
  const sw = w / STRIPS
  const strips = Array.from({ length: STRIPS }, (_, j) => {
    const d = ((j + 0.5) * sw - w / 2) / R
    return `translate3d(${(R * Math.sin(d)).toFixed(3)}px,0,${(R * (1 - Math.cos(d))).toFixed(3)}px) rotateY(${(-d).toFixed(5)}rad)`
  })
  return { W: width, A, h, w, n, slots, alpha, R, p, cy: A / 2, sw, strips }
}

type WallGeometry = ReturnType<typeof wallGeometry>

/** Where a panel `offset` panels from the centre hangs on the wall: its angle and its position, in pixels. */
export function panelPose(offset: number, alpha: number, wallRadius: number) {
  const theta = offset * alpha
  return { theta, x: wallRadius * Math.sin(theta), z: wallRadius * (1 - Math.cos(theta)) }
}

/** Screen offset from the view centre of a point on the wall, matching the CSS camera and its tilt. */
export function projectPoint(x: number, y: number, z: number, perspective: number, tilt: number) {
  const a = (-tilt * Math.PI) / 180
  const y2 = y * Math.cos(a) - (z - perspective) * Math.sin(a)
  const z2 = perspective + y * Math.sin(a) + (z - perspective) * Math.cos(a)
  const k = perspective / Math.max(perspective - z2, 1)
  return [x * k, y2 * k] as const
}

/** Where a screen point, as an offset from the view centre, hits the wall: its angle, and whether it lands on a panel. */
export function hitWall(x: number, y: number, { p, R, h }: Pick<WallGeometry, "p" | "R" | "h">) {
  // Ray from the viewer through the screen point, against the far side of the wall's cylinder.
  const a = x * x + p * p
  const b = -2 * p * (p - R)
  const c = p * (p - 2 * R)
  const disc = b * b - 4 * a * c
  if (disc < 0) return null
  const t = (-b + Math.sqrt(disc)) / (2 * a)
  const X = t * x
  const Z = p * (1 - t)
  return { theta: Math.atan2(X, R - Z), onPanel: Math.abs((y * (p - Z)) / p) <= h / 2 }
}

/** Advances the snap spring by `dt` seconds, in fixed substeps. */
export function stepSpring(s: { pos: number; vel: number; target: number }, dt: number) {
  for (let left = dt; left > 0; left -= SUBSTEP) {
    const h = Math.min(left, SUBSTEP)
    s.vel += (SPRING_K * (s.target - s.pos) - SPRING_C * s.vel) * h
    s.pos += s.vel * h
  }
}

/** The wall's edge fade as a horizontal mask: 1 in the middle, 1 - dim at the edges. */
export function edgeMask(dim: number) {
  const stops = Array.from({ length: 21 }, (_, k) => {
    const u = Math.abs(k / 10 - 1)
    return `rgba(0,0,0,${(1 - dim * smoothstep(0.2, 1, u)).toFixed(3)}) ${k * 5}%`
  })
  return `linear-gradient(to right, ${stops.join(", ")})`
}

const restingPos = (s: { mode: Mode; pos: number; target: number }) => (s.mode === "spring" ? s.target : s.pos)

// The panels' visibility is written only when it changes, so a frame writes nothing but transform and opacity.
const show = (el: HTMLElement, visible: boolean) => {
  const value = visible ? "" : "hidden"
  if (el.style.visibility !== value) el.style.visibility = value
}

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION)
  query?.addEventListener("change", onChange)
  return () => query?.removeEventListener("change", onChange)
}
const readReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  )
}

export function ConcaveCarousel({
  items = DEFAULT_ITEMS,
  startIndex = 0,
  aspect = 1.25,
  size = 0.46,
  curvature = 0.72,
  distance = 4,
  tilt = 0,
  gap = 16,
  radius = 14,
  reflection = 0.06,
  dim = 0.35,
  autoplay = "drift",
  speed = 0.16,
  interval = 4,
  snap = true,
  inertia = 0.5,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  captions = true,
  controls = true,
  backgroundColor,
  paused: pausedProp = false,
  onIndexChange,
  onSelect,
  controlsRef,
  className,
  style,
  onKeyDown,
  ...props
}: ConcaveCarouselProps) {
  const count = items.length
  const start = count ? mod(Math.round(startIndex), count) : 0

  const stageRef = React.useRef<HTMLDivElement>(null)
  const panelRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const captionRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const wakeRef = React.useRef<(() => void) | null>(null)

  const [box, setBox] = React.useState({ w: 0, h: 0 })
  const [index, setIndex] = React.useState(start)
  const [dragging, setDragging] = React.useState(false)
  const [ratios, setRatios] = React.useState<Record<string, number>>({})
  const reduced = React.useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false)

  // Space toggles the pause; a new `paused` prop takes over again.
  const [paused, setPaused] = React.useState(pausedProp)
  const [pausedSeen, setPausedSeen] = React.useState(pausedProp)
  if (pausedSeen !== pausedProp) {
    setPausedSeen(pausedProp)
    setPaused(pausedProp)
  }

  const geo = React.useMemo(
    () => wallGeometry({ width: box.w, height: box.h, count, size, aspect, curvature, gap, distance, captions, controls }),
    [box, count, size, aspect, curvature, gap, distance, captions, controls]
  )
  const mask = React.useMemo(() => edgeMask(dim), [dim])

  // Motion state lives in a plain object; the loop writes transforms straight to the panels.
  const motionRef = React.useRef({
    // In panels; the centred index is round(pos).
    pos: start,
    vel: 0,
    target: start,
    drift: 0,
    mode: "drift" as Mode,
    hovered: false,
    holdUntil: 0,
    nextStep: 0,
    raf: 0,
    timer: 0,
    last: 0,
    visible: true,
  })
  const indexRef = React.useRef(start)
  const geoRef = React.useRef(geo)
  const live: Live = { autoplay, speed, interval, paused, reduced, pauseOnHover, snap, inertia, tilt, gap, captions, items, onIndexChange, onSelect }
  const liveRef = React.useRef(live)

  // Props and geometry reach the loop and the handlers through refs written here, never during render. It is a
  // layout effect, declared first, so the layout effects below already read this render's values.
  React.useLayoutEffect(() => {
    geoRef.current = geo
    liveRef.current = live
  })

  const layout = React.useCallback(() => {
    const g = geoRef.current
    if (!g.W) return
    const { pos } = motionRef.current
    const { captions: showCaptions, gap: gapPx, tilt: tiltDeg } = liveRef.current
    for (let i = 0; i < g.slots; i++) {
      const panel = panelRefs.current[i]
      if (!panel) continue
      const o = wrapOffset(i - pos, g.slots)
      const { theta, x, z } = panelPose(o, g.alpha, g.R)
      // Hide panels behind the viewer, facing away or off screen (that is also where the wall wraps round).
      const visible = facesViewer(theta, g.R, g.p, g.W, g.w)
      show(panel, visible)
      if (visible) panel.style.transform = `translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${(-theta).toFixed(5)}rad)`

      const caption = captionRefs.current[i]
      if (!caption || !showCaptions) continue
      if (!visible || Math.abs(o) > 1.5) {
        caption.style.opacity = "0"
        show(caption, false)
        continue
      }
      const [bx, by] = projectPoint(x, g.h / 2, z, g.p, tiltDeg)
      // Each caption rides under its panel and fades out as the panel leaves the centre.
      const opacity = 1 - smoothstep(0.46, 0.85, Math.abs(bx) / (g.w + gapPx))
      caption.style.opacity = opacity.toFixed(3)
      show(caption, opacity > 0.001)
      caption.style.transform = `translate(${(g.W / 2 + bx).toFixed(2)}px, ${(g.cy + by + CAPTION_OFFSET * g.h).toFixed(2)}px) translateX(-50%)`
    }
  }, [])

  const syncIndex = React.useCallback(() => {
    const next = mod(Math.round(motionRef.current.pos), geoRef.current.n)
    if (next === indexRef.current) return
    indexRef.current = next
    setIndex(next)
    liveRef.current.onIndexChange?.(next)
  }, [])

  const kick = React.useCallback(() => wakeRef.current?.(), [])

  /** Holds autoplay for a moment after any input. */
  const touch = React.useCallback(() => {
    const now = performance.now()
    motionRef.current.holdUntil = now + RESUME_AFTER_INPUT
    motionRef.current.nextStep = now + liveRef.current.interval * 1000
  }, [])

  const springTo = React.useCallback(
    (target: number, vel?: number) => {
      const s = motionRef.current
      if (vel !== undefined) s.vel = vel
      else if (s.mode === "drift") s.vel = s.drift
      s.drift = 0
      s.target = target
      if (liveRef.current.reduced) {
        s.pos = target
        s.vel = 0
        s.mode = "drift"
        layout()
        syncIndex()
        return
      }
      s.mode = "spring"
      kick()
    },
    [kick, layout, syncIndex]
  )

  const next = React.useCallback(() => {
    touch()
    springTo(Math.round(restingPos(motionRef.current)) + 1)
  }, [springTo, touch])

  const previous = React.useCallback(() => {
    touch()
    springTo(Math.round(restingPos(motionRef.current)) - 1)
  }, [springTo, touch])

  const goTo = React.useCallback(
    (i: number) => {
      const n = geoRef.current.n
      touch()
      const from = Math.round(restingPos(motionRef.current))
      let delta = mod(i - from, n)
      if (delta > n / 2) delta -= n
      springTo(from + delta)
    },
    [springTo, touch]
  )

  const select = React.useCallback((i: number) => {
    const item = liveRef.current.items[i]
    if (!item) return
    liveRef.current.onSelect?.(item, i)
    if (item.href) window.location.assign(item.href)
  }, [])

  React.useImperativeHandle(controlsRef, () => ({ next, previous, goTo }), [next, previous, goTo])

  React.useLayoutEffect(() => {
    // The root's ref stays the consumer's, so the root is reached through the stage.
    const root = stageRef.current?.parentElement
    if (!root) return
    const measure = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  React.useLayoutEffect(() => {
    layout()
  }, [geo, captions, tilt, layout])

  // Re-anchor if the item count changes.
  React.useLayoutEffect(() => {
    const s = motionRef.current
    if (!count) return
    s.pos = s.target = mod(Math.round(s.pos), count)
    s.vel = 0
    s.mode = "drift"
    layout()
    syncIndex()
  }, [count, layout, syncIndex])

  // The frame loop. It runs only while something moves, sleeps until autoplay's next move is due, and stops off screen.
  React.useEffect(() => {
    const root = stageRef.current?.parentElement
    if (!root) return
    const s = motionRef.current

    function frame(now: number) {
      if (!s.visible) {
        s.raf = 0
        return
      }
      const dt = clamp((now - s.last) / 1000, MIN_DT, MAX_DT)
      s.last = now
      const L = liveRef.current
      const autoplayOn = L.autoplay !== "off" && !L.paused && !L.reduced && L.speed !== 0
      const braked = L.pauseOnHover && s.hovered

      // Drift eases toward its target speed: it brakes quickly and picks up gently.
      const want = autoplayOn && L.autoplay === "drift" && s.mode === "drift" && !braked && now >= s.holdUntil ? L.speed : 0
      s.drift += (want - s.drift) * (1 - Math.exp(-dt / (Math.abs(want) < Math.abs(s.drift) ? BRAKE_TAU : ACCEL_TAU)))

      if (s.mode === "drift") {
        s.pos += s.drift * dt
      } else if (s.mode === "spring") {
        stepSpring(s, dt)
        if (Math.abs(s.target - s.pos) < 1e-4 && Math.abs(s.vel) < 1e-3) {
          s.pos = s.target
          s.vel = 0
          s.mode = "drift"
        }
      } else if (s.mode === "coast") {
        // Exponential friction: coasts the same distance a snapped flick projects (vel × inertia × COAST_TIME).
        s.vel *= Math.exp(-dt / Math.max(L.inertia * COAST_TIME, 0.05))
        s.pos += s.vel * dt
        if (Math.abs(s.vel) < 0.01) {
          s.vel = 0
          s.mode = "drift"
        }
      }

      if (autoplayOn && L.autoplay === "step" && s.mode === "drift" && !braked && now >= s.nextStep) {
        s.mode = "spring"
        s.target = Math.round(s.pos) + Math.sign(L.speed)
        s.nextStep = now + L.interval * 1000
      }

      layout()
      syncIndex()

      const moving = s.mode === "spring" || s.mode === "coast" || want !== 0 || Math.abs(s.drift) >= 1e-5
      if (moving) {
        s.raf = requestAnimationFrame(frame)
        return
      }
      s.raf = 0
      s.drift = 0
      // At rest the loop sleeps until autoplay's next move is due, instead of drawing the same frame again.
      if (autoplayOn && !braked && s.mode === "drift") {
        const due = L.autoplay === "step" ? s.nextStep : s.holdUntil
        s.timer = window.setTimeout(wake, Math.max(0, due - performance.now()))
      }
    }

    function wake() {
      window.clearTimeout(s.timer)
      s.timer = 0
      // Never schedule while off screen or in a hidden tab; the observers wake the loop again.
      if (s.raf || !s.visible || document.hidden) return
      s.last = performance.now()
      s.raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
      window.clearTimeout(s.timer)
      s.timer = 0
    }

    const intersection = new IntersectionObserver((entries) => {
      s.visible = entries.some((entry) => entry.isIntersecting)
      if (s.visible) wake()
      else stop()
    })
    intersection.observe(root)
    const onVisibility = () => {
      if (document.hidden) return
      s.last = performance.now()
      wake()
    }
    document.addEventListener("visibilitychange", onVisibility)
    wakeRef.current = wake

    return () => {
      // Reset the ids too: Strict Mode remounts, and the next setup must be able to start a new loop.
      wakeRef.current = null
      stop()
      intersection.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [layout, syncIndex])

  React.useEffect(() => {
    kick()
  }, [kick, autoplay, speed, paused, reduced, pauseOnHover])

  // Read each image's aspect so it can be cropped to fill its panel.
  const loadersRef = React.useRef(new Map<string, HTMLImageElement>())
  React.useEffect(() => {
    const loaders = loadersRef.current
    for (const { src } of items) {
      if (loaders.has(src)) continue
      const image = new Image()
      image.onload = () => {
        if (image.naturalHeight) setRatios((r) => ({ ...r, [src]: image.naturalWidth / image.naturalHeight }))
      }
      image.src = src
      loaders.set(src, image)
    }
  }, [items])
  React.useEffect(() => {
    const loaders = loadersRef.current
    return () => {
      for (const image of loaders.values()) image.onload = null
      loaders.clear()
    }
  }, [])

  // Wheel: one panel per notch; small trackpad deltas add up.
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage || !wheel) return
    let acc = 0
    let idle = 0
    const onWheel = (event: WheelEvent) => {
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!raw) return
      event.preventDefault()
      acc += raw * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 400 : 1)
      window.clearTimeout(idle)
      idle = window.setTimeout(() => (acc = 0), 200)
      if (Math.abs(acc) >= WHEEL_STEP) {
        if (acc > 0) next()
        else previous()
        acc = 0
      }
    }
    stage.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      stage.removeEventListener("wheel", onWheel)
      window.clearTimeout(idle)
    }
  }, [wheel, next, previous])

  const hit = React.useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (!stage) return null
    const g = geoRef.current
    const rect = stage.getBoundingClientRect()
    return hitWall(clientX - rect.left - g.W / 2, clientY - rect.top - g.cy, g)
  }, [])

  // Pointer: a drag turns the wall so the grabbed point stays under the pointer; a tap selects.
  const dragRef = React.useRef({ id: -1, x: 0, theta: 0, from: 0, moved: false, onPanel: false, grabbed: false, samples: [] as { t: number; pos: number }[] })

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !count) return
    const h = hit(event.clientX, event.clientY)
    if (!h) return
    const s = motionRef.current
    dragRef.current = { id: event.pointerId, x: event.clientX, theta: h.theta, from: s.pos, moved: false, onPanel: h.onPanel, grabbed: draggable, samples: [{ t: event.timeStamp, pos: s.pos }] }
    if (draggable) {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      // Catch the wall: it stops where it is so the held point does not slip.
      s.mode = "drag"
      s.vel = 0
      s.drift = 0
    }
    touch()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (d.id !== event.pointerId || !d.grabbed) return
    if (!d.moved && Math.abs(event.clientX - d.x) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }
    const h = hit(event.clientX, event.clientY)
    if (!h) return
    const s = motionRef.current
    s.pos = d.from - (h.theta - d.theta) / geoRef.current.alpha
    d.samples.push({ t: event.timeStamp, pos: s.pos })
    if (d.samples.length > 8) d.samples.shift()
    touch()
    layout()
    syncIndex()
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (d.id !== event.pointerId) return
    d.id = -1
    const s = motionRef.current
    touch()

    if (!d.moved) {
      if (event.type === "pointerup" && d.onPanel) {
        const h = hit(event.clientX, event.clientY)
        const i = h ? mod(Math.round(s.pos + h.theta / geoRef.current.alpha), geoRef.current.n) : indexRef.current
        if (i === indexRef.current) {
          select(i)
          if (d.grabbed) springTo(Math.round(s.pos), 0)
        } else goTo(i)
      } else if (d.grabbed) springTo(Math.round(s.pos), 0)
      return
    }

    setDragging(false)
    const recent = d.samples.filter((sample) => event.timeStamp - sample.t < 100)
    // Panels per second.
    let vel = 0
    if (recent.length > 1) {
      const a = recent[0]
      const b = recent[recent.length - 1]
      vel = (b.pos - a.pos) / Math.max((b.t - a.t) / 1000, 0.016)
    }
    vel = clamp(vel, -25, 25)
    const L = liveRef.current
    if (L.snap) springTo(Math.round(s.pos + vel * L.inertia * COAST_TIME), vel)
    else {
      s.vel = vel
      s.mode = L.reduced ? "drift" : "coast"
      kick()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    // Let the controls handle their own keys.
    if (event.defaultPrevented || event.target instanceof HTMLButtonElement) return
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next()
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") previous()
    else if (event.key === " ") setPaused((v) => !v)
    else if (event.key === "Enter") select(indexRef.current)
    else return
    event.preventDefault()
  }

  const { h, w, sw, strips, p, cy, slots } = geo
  const corner = Math.min(radius, sw)

  // The wall only changes with the geometry and the images, so a new centred index does not re-render it.
  const wall = React.useMemo(
    () =>
      Array.from({ length: count ? slots : 0 }, (_, i) => {
        const item = items[i % count]
        // Crop like object-fit: cover.
        const ratio = ratios[item.src] ?? aspect
        const bw = ratio > aspect ? h * ratio : w
        const bh = ratio > aspect ? h : w / ratio
        const ox = (w - bw) / 2
        const oy = (h - bh) / 2
        const image = `url("${item.src}")`
        const fade = `linear-gradient(to top, rgba(0,0,0,${reflection}) 0%, rgba(0,0,0,0) ${REFLECT_LENGTH * 100}%)`
        return (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el
            }}
            data-slot="concave-carousel-panel"
            className="absolute top-0 left-0 size-0 will-change-transform [transform-style:preserve-3d]"
          >
            {strips.map((transform, j) => {
              const face: React.CSSProperties = {
                backgroundImage: image,
                backgroundSize: `${bw}px ${bh}px`,
                backgroundPosition: `${(ox - j * sw + STRIP_OVERLAP / 2).toFixed(2)}px ${oy.toFixed(2)}px`,
                borderRadius: j === 0 ? `${corner}px 0 0 ${corner}px` : j === STRIPS - 1 ? `0 ${corner}px ${corner}px 0` : undefined,
              }
              return (
                <div
                  key={j}
                  className="absolute [backface-visibility:hidden]"
                  style={{ width: sw + STRIP_OVERLAP, height: h, left: -(sw + STRIP_OVERLAP) / 2, top: -h / 2, transform }}
                >
                  <div className="pointer-events-none absolute top-0 left-0 size-full bg-muted bg-no-repeat" style={face} />
                  {reflection > 0 && (
                    // Mirror image under the panel, faded by a static mask.
                    <div
                      className="pointer-events-none absolute left-0 size-full -scale-y-100 bg-muted bg-no-repeat"
                      style={{ ...face, top: h * (1 + REFLECT_GAP), maskImage: fade, WebkitMaskImage: fade }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      }),
    [count, slots, items, ratios, aspect, h, w, sw, strips, corner, reflection]
  )

  const captionNodes = React.useMemo(
    () =>
      captions && count
        ? Array.from({ length: slots }, (_, i) => {
            const item = items[i % count]
            return (
              <div
                key={i}
                ref={(el) => {
                  captionRefs.current[i] = el
                }}
                className="absolute top-0 left-0 text-center whitespace-nowrap opacity-0 will-change-[transform,opacity]"
              >
                {item.title && <div className="text-[15px] leading-5 font-semibold tracking-[-0.01em]">{item.title}</div>}
                {item.subtitle && <div className="mt-1 text-[13px] leading-[18px] opacity-55">{item.subtitle}</div>}
              </div>
            )
          })
        : null,
    [captions, count, slots, items]
  )

  const current = items[index] ?? items[0]
  const drifting = autoplay !== "off" && !paused && !reduced

  return (
    <div
      data-slot="concave-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={DEFAULT_LABEL}
      tabIndex={0}
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden text-foreground outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className
      )}
      style={{ background: backgroundColor, ...style }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        ref={stageRef}
        aria-hidden
        className={cn("absolute inset-0 touch-pan-y overflow-hidden", dragging ? "cursor-grabbing" : "cursor-grab")}
        style={{ perspective: `${p}px`, perspectiveOrigin: `50% ${cy}px`, maskImage: mask, WebkitMaskImage: mask }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") motionRef.current.hovered = true
        }}
        onPointerLeave={() => {
          const s = motionRef.current
          s.hovered = false
          s.holdUntil = Math.max(s.holdUntil, performance.now() + RESUME_AFTER_HOVER)
          kick()
        }}
      >
        <div
          className="absolute left-1/2 size-0 [transform-style:preserve-3d]"
          style={{ top: cy, transformOrigin: `0 0 ${p}px`, transform: tilt ? `rotateX(${-tilt}deg)` : undefined }}
        >
          {wall}
        </div>
      </div>

      {captionNodes && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {captionNodes}
        </div>
      )}

      {current && (
        <p className="sr-only" aria-live={drifting ? "off" : "polite"}>
          {`${current.title ?? current.alt}, ${index + 1} of ${count}${current.subtitle ? `. ${current.subtitle}` : ""}. ${current.alt}`}
        </p>
      )}

      {controls && count > 0 && (
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center" style={{ top: geo.A - 16 }}>
          <button
            type="button"
            aria-label="Previous"
            onClick={previous}
            className="grid size-8 cursor-pointer place-items-center rounded-full bg-foreground/10 p-0 transition-[background-color] duration-160 ease-[ease] hover:bg-foreground/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Chevron direction="left" />
          </button>
          <span aria-hidden className="w-[92px] text-center text-[12px] tracking-[0.02em] tabular-nums">
            <span className="opacity-85">{pad(index + 1)}</span>
            <span className="opacity-40"> / {pad(count)}</span>
          </span>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="grid size-8 cursor-pointer place-items-center rounded-full bg-foreground/10 p-0 transition-[background-color] duration-160 ease-[ease] hover:bg-foreground/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Chevron direction="right" />
          </button>
        </div>
      )}
    </div>
  )
}
