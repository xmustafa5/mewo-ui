"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TiltedTilesProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Image URLs tiled across the plane, each column in its own fixed shuffle. An empty list shows plain placeholder tiles. */
  images?: string[]
  /** Number of scrolling columns. */
  columns?: number
  /** Tiles in one column before the loop repeats. */
  tilesPerColumn?: number
  /** Width divided by height of a single tile. */
  tileAspect?: number
  /** Vertical space between tiles, in pixels. */
  rowGap?: number
  /** Horizontal space between columns, in pixels. */
  columnGap?: number
  /** Corner radius of each tile, in pixels. */
  borderRadius?: number
  /** Perspective depth of the scene, in pixels. */
  perspective?: number
  /** Degrees the plane leans back. */
  rotateX?: number
  /** Degrees the plane turns sideways. */
  rotateY?: number
  /** Degrees the plane spins within its own surface. */
  rotateZ?: number
  /** Horizontal shift of the plane, in pixels. */
  offsetX?: number
  /** Vertical shift of the plane, in pixels. */
  offsetY?: number
  /** Depth shift of the plane, in pixels. */
  offsetZ?: number
  /** Plane width as a percentage of the root. */
  planeWidth?: number
  /** Plane height as a percentage of the root. */
  planeHeight?: number
  /** Head start given to alternating columns, as a percentage of a column's width. */
  stagger?: number
  /** Seconds a column takes to travel one full loop. */
  duration?: number
  /** Send every other column in the opposite direction. */
  alternate?: boolean
  /** Height of the top fade, as a percentage of the root. 0 turns it off. */
  fadeTop?: number
  /** Height of the bottom fade, as a percentage of the root. 0 turns it off. */
  fadeBottom?: number
  /** Let the pointer steer the plane. */
  parallax?: boolean
  /** Most degrees the pointer can add to the tilt. */
  parallaxStrength?: number
  /** Hold the scroll while the pointer rests on the plane. */
  pauseOnHover?: boolean
  /** Saturation of the tiles, where 1 is untouched. */
  saturation?: number
}

type Settings = {
  rotateX: number
  rotateY: number
  rotateZ: number
  offsetX: number
  offsetY: number
  offsetZ: number
  duration: number
  alternate: boolean
  parallax: boolean
  parallaxStrength: number
  pauseOnHover: boolean
  rowGap: number
  copies: number
}

type TileLayout = {
  columns: number
  columnGap: number
  tilesPerColumn: number
  tileAspect: number
  rowGap: number
  planeWidth: number
  planeHeight: number
}

const DEFAULT_IMAGES = Array.from({ length: 10 }, (_, index) => `https://picsum.photos/seed/mewo-tilted-tiles-${index + 1}/500/500`)

// The fade's measured stops: [share of the fade height, opacity]. The fade eases in slowly, then opens up.
const FADE_STOPS: [number, number][] = [
  [0, 0],
  [0.153, 0.02],
  [0.171, 0.035],
  [0.243, 0.075],
  [0.35, 0.15],
  [0.5, 0.3],
  [1, 1],
]
// The tilt follows the pointer through two smoothing stages, in seconds: an overdamped ease with no overshoot.
const POINTER_TAU = 0.04
const TILT_TAU = 0.217
// While the scroll is held on hover, the loop sleeps once both stages are this close to the pointer (a fraction of
// the tilt's full range: far under a hundredth of a degree).
const SETTLE = 1e-4
// Frame time is clamped so a hitch or a return from another tab does not jump the scroll.
const MIN_DT = 1 / 240
const MAX_DT = 0.05
// The first frame after the loop starts has no previous frame to measure against.
const FIRST_DT = 1 / 60
// A column's strip holds this many copies of its set until the root has been measured, and never fewer or more than these.
const UNMEASURED_COPIES = 3
const MIN_COPIES = 2
const MAX_COPIES = 60

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const pct = (value: number) => `${value.toFixed(3)}%`

/** The root's static fade: a mask gradient with `top` and `bottom` percent fades, or undefined with neither. */
export function fadeMask(top: number, bottom: number) {
  if (top <= 0 && bottom <= 0) return undefined
  const stops: string[] = []
  if (top > 0) for (const [at, alpha] of FADE_STOPS) stops.push(`rgb(0 0 0 / ${alpha}) ${pct(at * top)}`)
  else stops.push("rgb(0 0 0 / 1) 0%")
  if (bottom > 0) for (const [at, alpha] of [...FADE_STOPS].reverse()) stops.push(`rgb(0 0 0 / ${alpha}) ${pct(100 - at * bottom)}`)
  else stops.push("rgb(0 0 0 / 1) 100%")
  return `linear-gradient(to bottom, ${stops.join(", ")})`
}

/** Each column's fixed shuffle of `count` images; the first column keeps the given order. */
export function columnOrder(count: number, column: number) {
  const order = Array.from({ length: count }, (_, i) => i)
  if (column === 0) return order
  let seed = Math.imul(column + 1, 0x9e3779b1) >>> 0
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = order[i]
    order[i] = order[j]
    order[j] = swap
  }
  return order
}

/**
 * Copies of a column's set the strip needs to cover the column for the whole loop: one set scrolls out
 * while the rest fill the column. 5 square tiles at the default size need 3; narrow phone columns about 7.
 */
export function tileCopies(width: number, height: number, layout: TileLayout) {
  let copies = UNMEASURED_COPIES
  if (width > 0 && height > 0) {
    const columnWidth = ((layout.planeWidth / 100) * width - (layout.columns - 1) * layout.columnGap) / layout.columns
    const setHeight = layout.tilesPerColumn * (columnWidth / Math.max(0.05, layout.tileAspect) + layout.rowGap)
    if (setHeight > 0) copies = 1 + Math.ceil(((layout.planeHeight / 100) * height + layout.rowGap) / setHeight)
  }
  return clamp(copies, MIN_COPIES, MAX_COPIES)
}

/** The plane's pose: centred on the root, tilted, then shifted along its own axes. */
export function planeTransform(rotateX: number, rotateY: number, rotateZ: number, offsetX: number, offsetY: number, offsetZ: number) {
  return `translate(-50%, -50%) rotateX(${rotateX.toFixed(4)}deg) rotateY(${rotateY.toFixed(4)}deg) rotate(${rotateZ}deg) translate3d(${offsetX}px, ${offsetY}px, ${offsetZ}px)`
}

/** A strip `progress` of the way through one loop. One set is (strip height + one gap) / copies tall, so the loop wraps without a jump. */
export function stripTransform(progress: number, copies: number, rowGap: number) {
  return `translate3d(0, calc(${((-progress * 100) / copies).toFixed(4)}% - ${((progress * rowGap) / copies).toFixed(3)}px), 0)`
}

export function TiltedTiles({
  images = DEFAULT_IMAGES,
  columns = 16,
  tilesPerColumn = 5,
  tileAspect = 1,
  rowGap = 8,
  columnGap = 8,
  borderRadius = 0,
  perspective = 1600,
  rotateX = 40,
  rotateY = 16,
  rotateZ = -20,
  offsetX = -40,
  offsetY = 0,
  offsetZ = 0,
  planeWidth = 280,
  planeHeight = 260,
  stagger = 20,
  duration = 25,
  alternate = true,
  fadeTop = 22,
  fadeBottom = 0,
  parallax = true,
  parallaxStrength = 8,
  pauseOnHover = false,
  saturation = 1,
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: TiltedTilesProps) {
  const planeRef = React.useRef<HTMLDivElement>(null)
  const stripRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  const cols = Math.max(1, Math.round(columns))
  const perColumn = Math.max(1, Math.round(tilesPerColumn))
  const copies = tileCopies(size.width, size.height, { columns: cols, columnGap, tilesPerColumn: perColumn, tileAspect, rowGap, planeWidth, planeHeight })

  const columnTiles = React.useMemo(
    () =>
      Array.from({ length: cols }, (_, column) => {
        if (!images.length) return Array.from({ length: perColumn }, () => "")
        const order = columnOrder(images.length, column)
        return Array.from({ length: perColumn }, (_, j) => images[order[j % order.length]])
      }),
    [images, cols, perColumn]
  )

  const settings: Settings = { rotateX, rotateY, rotateZ, offsetX, offsetY, offsetZ, duration, alternate, parallax, parallaxStrength, pauseOnHover, rowGap, copies }
  const settingsRef = React.useRef(settings)
  // Wakes the loop after a prop change; set by the loop's effect.
  const wakeRef = React.useRef(() => {})
  // Frame state lives outside React: progress through one loop, the pointer, and its two smoothing stages.
  const motionRef = React.useRef({
    raf: 0,
    last: 0,
    progress: 0,
    hover: false,
    visible: true,
    reduced: false,
    target: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    tilt: { x: 0, y: 0 },
  })

  // Per-frame writes touch only transforms; the mask and the saturation stay on the root untouched.
  const draw = React.useCallback(() => {
    const s = settingsRef.current
    const m = motionRef.current
    const plane = planeRef.current
    if (!plane) return
    plane.style.transform = planeTransform(s.rotateX - m.tilt.y * s.parallaxStrength, s.rotateY + m.tilt.x * s.parallaxStrength, s.rotateZ, s.offsetX, s.offsetY, s.offsetZ)
    stripRefs.current.forEach((strip, i) => {
      if (!strip) return
      strip.style.transform = stripTransform(s.alternate && i % 2 === 1 ? 1 - m.progress : m.progress, s.copies, s.rowGap)
    })
  }, [])

  // The loop, the observers and the listeners are set up once; props reach the loop through settingsRef.
  React.useEffect(() => {
    // The root's ref stays the consumer's, so the root is reached through the plane.
    const root = planeRef.current?.parentElement
    if (!root) return
    const m = motionRef.current

    const tick = (now: number) => {
      const dt = m.last ? clamp((now - m.last) / 1000, MIN_DT, MAX_DT) : FIRST_DT
      m.last = now
      const s = settingsRef.current
      const held = s.pauseOnHover && m.hover
      if (!held) m.progress = (m.progress + dt / Math.max(0.1, s.duration)) % 1
      const targetX = s.parallax ? m.target.x : 0
      const targetY = s.parallax ? m.target.y : 0
      const pointerEase = 1 - Math.exp(-dt / POINTER_TAU)
      const tiltEase = 1 - Math.exp(-dt / TILT_TAU)
      // The tilt chases last frame's smoothed pointer, so it reacts one frame after the pointer moves.
      m.tilt.x += (m.pointer.x - m.tilt.x) * tiltEase
      m.tilt.y += (m.pointer.y - m.tilt.y) * tiltEase
      m.pointer.x += (targetX - m.pointer.x) * pointerEase
      m.pointer.y += (targetY - m.pointer.y) * pointerEase
      // Held and settled, nothing moves: snap to the target and sleep until the pointer or a prop changes.
      const settled = [targetX - m.pointer.x, targetY - m.pointer.y, m.pointer.x - m.tilt.x, m.pointer.y - m.tilt.y].every((d) => Math.abs(d) < SETTLE)
      if (held && settled) {
        m.pointer.x = m.tilt.x = targetX
        m.pointer.y = m.tilt.y = targetY
        draw()
        m.raf = 0
        return
      }
      draw()
      m.raf = requestAnimationFrame(tick)
    }

    // The loop never runs off screen, in a hidden tab or under reduced motion.
    const start = () => {
      if (m.raf || m.reduced || !m.visible || document.hidden) return
      m.last = 0
      m.raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(m.raf)
      m.raf = 0
    }

    // Reduced motion freezes the scroll where it is and lays the tilt back to rest.
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const onMotionPreference = () => {
      m.reduced = motionQuery?.matches ?? false
      if (m.reduced) {
        stop()
        for (const point of [m.target, m.pointer, m.tilt]) point.x = point.y = 0
        draw()
      } else start()
    }
    motionQuery?.addEventListener("change", onMotionPreference)
    wakeRef.current = start

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener("visibilitychange", onVisibility)

    const intersection = new IntersectionObserver((entries) => {
      m.visible = entries[entries.length - 1].isIntersecting
      if (m.visible) start()
      else stop()
    })
    intersection.observe(root)

    // The strip's copies are counted from the root's size.
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (Math.abs(s.width - width) < 0.5 && Math.abs(s.height - height) < 0.5 ? s : { width, height }))
    })
    resize.observe(root)

    const aim = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      m.target.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
      m.target.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
      // only a steering wall moves with the pointer; a held one without parallax stays asleep
      if (settingsRef.current.parallax) start()
    }
    const enter = (event: PointerEvent) => {
      m.hover = true
      aim(event)
    }
    const leave = () => {
      m.hover = false
      m.target.x = m.target.y = 0
      start()
    }
    // A touch has no pointerleave of its own once the finger lifts.
    const touchEnd = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") leave()
    }
    root.addEventListener("pointerenter", enter, { passive: true })
    root.addEventListener("pointermove", aim, { passive: true })
    root.addEventListener("pointerleave", leave, { passive: true })
    root.addEventListener("pointerup", touchEnd, { passive: true })
    root.addEventListener("pointercancel", touchEnd, { passive: true })

    onMotionPreference()
    return () => {
      stop()
      wakeRef.current = () => {}
      motionQuery?.removeEventListener("change", onMotionPreference)
      document.removeEventListener("visibilitychange", onVisibility)
      intersection.disconnect()
      resize.disconnect()
      root.removeEventListener("pointerenter", enter)
      root.removeEventListener("pointermove", aim)
      root.removeEventListener("pointerleave", leave)
      root.removeEventListener("pointerup", touchEnd)
      root.removeEventListener("pointercancel", touchEnd)
    }
  }, [draw])

  // Props reach the loop here, after render, and the wall is redrawn before the browser paints, so a change
  // shows at once even while the loop is stopped (off screen or reduced motion).
  React.useLayoutEffect(() => {
    settingsRef.current = settings
    stripRefs.current.length = cols
    draw()
    wakeRef.current()
  })

  const mask = fadeMask(fadeTop, fadeBottom)

  return (
    <div
      data-slot="tilted-tiles"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        perspective: `${perspective}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
        filter: saturation !== 1 ? `saturate(${saturation})` : undefined,
        ...style,
      }}
      {...props}
    >
      <div
        ref={planeRef}
        className="absolute top-1/2 left-1/2 grid"
        style={{
          width: `${planeWidth}%`,
          height: `${planeHeight}%`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: `${columnGap}px`,
          // The resting pose, for the first paint and for scripting off; the frame loop takes over from here.
          transform: planeTransform(rotateX, rotateY, rotateZ, offsetX, offsetY, offsetZ),
        }}
      >
        {columnTiles.map((set, column) => (
          <div key={column} data-slot="tilted-tiles-column" className="overflow-hidden" style={{ paddingTop: `${stagger * (2 - (column % 3))}%` }}>
            <div
              ref={(el) => {
                stripRefs.current[column] = el
              }}
              data-slot="tilted-tiles-strip"
              className="flex flex-col will-change-transform"
              style={{ rowGap: `${rowGap}px` }}
            >
              {Array.from({ length: copies }, (_, copy) =>
                set.map((src, j) => (
                  <div
                    key={`${copy}-${j}`}
                    className="w-full shrink-0 bg-muted bg-cover bg-center bg-no-repeat"
                    style={{ aspectRatio: tileAspect, borderRadius, backgroundImage: src ? `url(${JSON.stringify(src)})` : undefined }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
