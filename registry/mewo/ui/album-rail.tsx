"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlbumRailItem {
  /** Album title, shown in the caption. */
  title: string
  /** Artist, shown under the title. */
  artist: string
  /** Image URL for the sleeve. Also printed on the record's centre label. */
  cover: string
  /** Tint for the play button. Picked from the cover when left out. */
  color?: string
}

export interface AlbumRailProps extends Omit<React.ComponentProps<"div">, "children" | "onChange"> {
  /** Albums, in order. */
  albums?: AlbumRailItem[]
  /** Index of the sleeve shown first. */
  initialIndex?: number
  /** Largest sleeve edge in pixels. Shrinks to fit narrow containers. */
  size?: number
  /** How many sleeves stay visible on each side of the front one. */
  visible?: number
  /** Y rotation of the side sleeves, in degrees. */
  turn?: number
  /** Extra in-plane tilt per step away from the front, in degrees: the "hand of cards" look. */
  fan?: number
  /** Wrap around at the ends. Needs three albums or more. */
  loop?: boolean
  /** Advance every this many milliseconds while nothing is playing. `false` turns it off. */
  autoplay?: number | false
  /** Hold autoplay while a mouse is over the rail. */
  pauseOnHover?: boolean
  /** Show the title and artist under the front sleeve. */
  showCaption?: boolean
  /** Show the previous, tick ruler, play and next bar under the caption. */
  showControls?: boolean
  /** Play button tint when the cover colour can't be read (a cross-origin image served without CORS, say). */
  accent?: string
  /** Called with the front album's index and the album whenever it changes. */
  onChange?: (index: number, album: AlbumRailItem) => void
  /** Called when a record starts or stops playing, with the front album's index and the album. */
  onPlayChange?: (playing: boolean, index: number, album: AlbumRailItem) => void
}

const DEFAULT_ALBUMS: AlbumRailItem[] = [
  ["Paper Lanterns", "Juniper Hale"],
  ["Neon Orchard", "The Glass Foxes"],
  ["Quiet Engines", "Ottilie Marsh"],
  ["Salt & Static", "Tin Harbour"],
  ["Midnight Atlas", "Remy Okafor"],
  ["Soft Machinery", "Velour Club"],
  ["Golden Hour Drive", "Cassia Moon"],
  ["Northbound Lines", "Pine & Ash"],
  ["Echoes in Blue", "Theo Laurent"],
  ["Wild Signal", "Kite Season"],
].map(([title, artist], index) => ({ title, artist, cover: `https://picsum.photos/seed/mewo-album-rail-${index + 1}/600/600` }))

// Fan geometry, in units of the sleeve edge. The first neighbour's centre sits SPREAD from the front one's,
// the second sits STACK further out, and every gap after that is DECAY times the one before.
const SPREAD = 0.51
const STACK = 0.22
const DECAY = 0.88
// Side sleeves sink a little, so their bottoms roughly line up with the front one's.
const LIFT_NEAR = 0.03
const LIFT_FAR = 0.065
// The first step away shrinks a sleeve by SHRINK_NEAR; further steps approach SHRINK_FAR more, by SHRINK_DECAY a step.
const SHRINK_NEAR = 0.16
const SHRINK_FAR = 0.36
const SHRINK_DECAY = 0.62
// Steps past the first tilt by this share of `fan` each.
const FAN_FAR = 0.6
// Sleeves darken as they move away from the front: this much for the first step, this much per further step, at most SHADE_MAX.
const SHADE_NEAR = 0.22
const SHADE_FAR = 0.1
const SHADE_MAX = 0.6
// The front sleeve stacks on top, and every tenth of a step away sits one layer lower.
const Z_FRONT = 1000
const Z_STEPS = 10
// While a record plays the front sleeve slides PLAY_SHIFT to the left, its record slides RECORD_OUT out to the right,
// and the neighbours on either side move PLAY_SPREAD outwards to make room.
const PLAY_SHIFT = 0.29
const PLAY_SPREAD = 0.25
const RECORD_OUT = 0.53

// Durations of the ease-in-out moves, in milliseconds.
const RAIL_MS = 750
const RELEASE_MS = 550
const PLAY_OPEN_MS = 480
const PLAY_CLOSE_MS = 220
// A retargeted move carries the speed it had, up to this many times the speed of a plain ease from rest.
const MAX_CARRY = 3
// Each frame advances the moves by the time since the last one, held between these, so a hitch or a tab switch does not jump.
const MIN_FRAME_MS = 1000 / 240
const MAX_FRAME_MS = 50

// Dragging the sleeves moves the rail one album per DRAG_UNIT of the sleeve edge; the ruler moves one per tick.
const DRAG_UNIT = 0.55
// A press becomes a drag once it has moved this many pixels.
const DRAG_THRESHOLD = 6
// Past the ends of a rail that does not loop, the rail follows the pointer at this share of its travel.
const RUBBER_BAND = 0.3
// Pointer positions kept to measure the release speed, and how far back in milliseconds they count.
const DRAG_SAMPLES = 6
const FLING_WINDOW = 100
// On release the rail coasts for FLING_MS at the drag's speed, then snaps: at most FLING_MAX albums on,
// starting at no more than FLING_SPEED albums a second.
const FLING_MS = 160
const FLING_MAX = 3
const FLING_SPEED = 20
// Sideways wheel or trackpad travel steps once it passes WHEEL_STEP pixels, at most once per WHEEL_GAP milliseconds,
// and WHEEL_IDLE milliseconds of rest start the count again.
const WHEEL_STEP = 40
const WHEEL_GAP = 260
const WHEEL_IDLE = 160

// The ruler: one tick per album, TICK_GAP pixels apart, TICKS_PER_SIDE either side of the play button.
const TICK_GAP = 18
const TICKS_PER_SIDE = 8
// Ticks fade out within TICK_HOLE pixels of the play button, over TICK_HOLE_FADE pixels,
// and over the last TICK_EDGE_FADE gaps at either end of the ruler.
const TICK_HOLE = 27
const TICK_HOLE_FADE = 9
const TICK_EDGE_FADE = 3
const TICK_OPACITY = 0.4

// The sleeve edge is at most this share of the rail's width, so narrow containers shrink it.
const FIT = 0.42
// Covers are read at this size to pick the play button's tint.
const SAMPLE_SIZE = 16
// Every pixel counts a little; saturated ones count with the square of their saturation, and much less when dark.
const BASE_WEIGHT = 0.05
const DARK_LEVEL = 40
const DARK_WEIGHT = 0.2

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const mod = (value: number, count: number) => ((value % count) + count) % count
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Steps from the front to sleeve `index` while the rail is at `position`; on a looping rail, the short way round. */
export function railOffset(index: number, position: number, count: number, wrap: boolean) {
  const offset = index - position
  return wrap ? mod(offset + count / 2, count) - count / 2 : offset
}

/** The rail position that brings `index` to the front from `base`: the short way round on a loop, held in range otherwise. */
export function railTarget(index: number, base: number, count: number, wrap: boolean) {
  if (!wrap) return clamp(index, 0, count - 1)
  let delta = mod(index - base, count)
  if (delta > count / 2) delta -= count
  return base + delta
}

/**
 * How a sleeve sits `offset` steps from the front. `x`, `y` and `shift` (the extra x while a record plays) are in units
 * of the sleeve edge, `record` is the share of RECORD_OUT its record slides out, and the angles are in degrees.
 */
export function sleevePose(offset: number, span: number, turn: number, fan: number) {
  const dist = Math.abs(offset)
  const side = Math.sign(offset)
  // The first step away from the front is wide, later ones tuck in tighter and tighter.
  const near = Math.min(dist, 1)
  const far = Math.max(dist - 1, 0)
  return {
    x: side * (SPREAD * near + (STACK * (1 - DECAY ** far)) / (1 - DECAY)),
    y: LIFT_NEAR * near + LIFT_FAR * far,
    shift: side > 0 ? -PLAY_SHIFT + (PLAY_SHIFT + PLAY_SPREAD) * near : -PLAY_SHIFT + (PLAY_SHIFT - PLAY_SPREAD) * near,
    scale: 1 - SHRINK_NEAR * near - SHRINK_FAR * (1 - SHRINK_DECAY ** far),
    rotateY: side * near * turn,
    rotateZ: side * fan * (near + FAN_FAR * far),
    // Sleeves past `span` fade out over half a step.
    opacity: clamp(span + 0.5 - dist, 0, 1),
    shade: Math.min(near * SHADE_NEAR + far * SHADE_FAR, SHADE_MAX),
    // Only the front sleeve's record comes out.
    record: Math.max(0, 1 - dist * 2),
    zIndex: Z_FRONT - Math.round(dist * Z_STEPS),
  }
}

/** Where ruler tick `k` sits, in pixels from the ruler's centre, and how strongly it shows, while the rail is at `position`. */
export function tickPose(k: number, position: number, half: number) {
  const x = (k - TICKS_PER_SIDE - (position - Math.floor(position))) * TICK_GAP
  const ax = Math.abs(x)
  const fade = clamp((half - ax) / (TICK_GAP * TICK_EDGE_FADE), 0, 1) * clamp((ax - TICK_HOLE) / TICK_HOLE_FADE, 0, 1)
  return { x, opacity: fade * TICK_OPACITY }
}

/**
 * Where a released drag settles: the rail coasts on at the release `velocity` (pixels per millisecond, `unit` pixels per
 * album) for a moment, then snaps to an album, at most FLING_MAX away and inside the list unless it loops.
 */
export function flingTarget(position: number, velocity: number, unit: number, count: number, wrap: boolean) {
  const projected = position - (velocity * FLING_MS) / unit
  const target = clamp(Math.round(projected), Math.round(position) - FLING_MAX, Math.round(position) + FLING_MAX)
  return wrap ? target : clamp(target, 0, count - 1)
}

/** The vivid average colour of RGBA pixel data: saturated pixels weigh the most. Null when there are no pixels. */
export function coverColor(pixels: ArrayLike<number>) {
  let r = 0, g = 0, b = 0, w = 0
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2])
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2])
    const saturation = max ? (max - min) / max : 0
    const weight = BASE_WEIGHT + saturation * saturation * (max > DARK_LEVEL ? 1 : DARK_WEIGHT)
    r += pixels[i] * weight
    g += pixels[i + 1] * weight
    b += pixels[i + 2] * weight
    w += weight
  }
  return w ? `rgb(${Math.round(r / w)}, ${Math.round(g / w)}, ${Math.round(b / w)})` : null
}

/**
 * A cubic Hermite tween: it eases in and out (smoothstep) from rest, and when it is retargeted mid-flight it starts from
 * its current velocity, so rapid clicks and drag releases never jerk. Times are in milliseconds.
 */
export interface Tween {
  from: number
  to: number
  tangent: number
  start: number
  dur: number
  pos: number
  /** Units per second. */
  vel: number
  active: boolean
}

export const createTween = (value: number): Tween => ({ from: value, to: value, tangent: 0, start: 0, dur: 1, pos: value, vel: 0, active: false })

/** Moves a tween to time `now`. Returns whether it is still running. */
export function sampleTween(tw: Tween, now: number) {
  if (!tw.active) return false
  const t = clamp((now - tw.start) / tw.dur, 0, 1)
  const t2 = t * t
  const t3 = t2 * t
  const d = tw.to - tw.from
  tw.pos = tw.from + d * (3 * t2 - 2 * t3) + tw.tangent * (t3 - 2 * t2 + t)
  tw.vel = (d * (6 * t - 6 * t2) + tw.tangent * (3 * t2 - 4 * t + 1)) / (tw.dur / 1000)
  if (t >= 1) {
    tw.pos = tw.to
    tw.vel = 0
    tw.active = false
  }
  return tw.active
}

/** Sends a tween to `to` over `dur` milliseconds from time `now`, carrying its current speed. A `dur` of 0 jumps there. */
export function retargetTween(tw: Tween, to: number, dur: number, now: number) {
  sampleTween(tw, now)
  if (dur <= 0) {
    Object.assign(tw, { from: to, to, pos: to, vel: 0, active: false })
    return
  }
  const d = to - tw.pos
  // Carry the current speed in, but never so much that it overshoots or starts backwards.
  const tangent = d ? clamp((tw.vel * dur) / 1000 / d, 0, MAX_CARRY) * d : 0
  Object.assign(tw, { from: tw.pos, to, tangent, start: now, dur, vel: d ? tw.vel : 0, active: d !== 0 })
}

// Each cover is read once per page, however many rails show it, through one shared hidden canvas.
const covers = new Map<string, Promise<string | null>>()
let sampler: CanvasRenderingContext2D | null | undefined

function readCover(src: string) {
  let pending = covers.get(src)
  if (!pending) {
    pending = new Promise<string | null>((resolve) => {
      const image = new Image()
      // Reading pixels needs the image served with CORS headers. Without them the play button keeps the accent.
      image.crossOrigin = "anonymous"
      image.onload = () => {
        try {
          if (sampler === undefined) {
            const canvas = document.createElement("canvas")
            canvas.width = canvas.height = SAMPLE_SIZE
            sampler = canvas.getContext("2d", { willReadFrequently: true })
          }
          if (!sampler) return resolve(null)
          sampler.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          sampler.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          resolve(coverColor(sampler.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data))
        } catch {
          resolve(null) // A tainted canvas: the cover came without CORS headers after all.
        }
      }
      image.onerror = () => resolve(null)
      image.src = src
    })
    covers.set(src, pending)
  }
  return pending
}

/** The play button's tint: the album's own colour, else its cover's, else `fallback`. The last cover's colour stays while the next one loads. */
function useCoverColor(src: string | undefined, preset: string | undefined, fallback: string) {
  const [read, setRead] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (preset || !src) return
    let alive = true
    readCover(src).then((color) => {
      if (alive) setRead(color)
    })
    return () => {
      alive = false
    }
  }, [src, preset])
  if (preset) return preset
  return (src && read) || fallback
}

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION)
  query?.addEventListener("change", onChange)
  return () => query?.removeEventListener("change", onChange)
}
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false
const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}
const pageHidden = () => document.hidden
const onServer = () => false

const NAV_BUTTON =
  "grid size-[32px] flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-inherit opacity-55 transition-[opacity,background-color] duration-200 ease-[ease] hover:bg-foreground/6 hover:opacity-100"
const NAV_ICON = "size-[14px] fill-none stroke-current [stroke-width:1.6] [stroke-linecap:round] [stroke-linejoin:round]"

export function AlbumRail({
  albums = DEFAULT_ALBUMS,
  initialIndex = 0,
  size = 280,
  visible = 3,
  turn = 22,
  fan = 6,
  loop = true,
  autoplay = 4000,
  pauseOnHover = true,
  showCaption = true,
  showControls = true,
  accent = "#b19eef",
  onChange,
  onPlayChange,
  className,
  style,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: AlbumRailProps) {
  const count = albums.length
  const hasAlbums = count > 0
  // With fewer than three sleeves a wrapped rail would visibly teleport, so it stays linear.
  const wrap = loop && count >= 3
  const span = wrap ? clamp(visible, 0, Math.floor((count - 1) / 2)) : Math.max(0, visible)
  const start = count ? mod(Math.round(initialIndex), count) : 0

  // The root's ref stays the consumer's, so the root is reached through the stage.
  const stageRef = React.useRef<HTMLDivElement>(null)
  const rulerRef = React.useRef<HTMLDivElement>(null)
  const cards = React.useRef<(HTMLDivElement | null)[]>([])
  const records = React.useRef<(HTMLDivElement | null)[]>([])
  const shades = React.useRef<(HTMLSpanElement | null)[]>([])
  const sleeves = React.useRef<(HTMLButtonElement | null)[]>([])
  const ticks = React.useRef<(HTMLSpanElement | null)[]>([])

  const [active, setActive] = React.useState(start)
  const [playing, setPlaying] = React.useState(false)
  const [edge, setEdge] = React.useState(size)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [offscreen, setOffscreen] = React.useState(false)
  const hidden = React.useSyncExternalStore(subscribeVisibility, pageHidden, onServer)
  const reduced = React.useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, onServer)
  // Bumped on every navigation so the autoplay timer restarts right away,
  // not only once the rail has moved far enough to change the front sleeve.
  const [navCount, setNavCount] = React.useState(0)

  // Motion lives outside React: every frame positions the sleeves directly, and React only re-renders when the front
  // sleeve or the play state changes. `clock` is the moves' own time, advanced by clamped frame steps.
  const motion = React.useRef({
    rail: createTween(start),
    play: createTween(0),
    raf: 0,
    clock: 0,
    last: 0,
    visible: true,
    // Stacking and visibility are written only when they change, not every frame.
    written: new WeakMap<HTMLElement, { zIndex: number; shown: boolean }>(),
  })
  const activeRef = React.useRef(start)
  const playingRef = React.useRef(false)
  // Half the ruler's width, until it is measured.
  const rulerHalf = React.useRef(150)
  const cfg = React.useRef({ count, edge, span, turn, fan, wrap, reduced })
  const handlers = React.useRef({ albums, onChange, onPlayChange })

  // Props reach the motion code through these refs, written after render and before the layout effects below read them.
  React.useLayoutEffect(() => {
    cfg.current = { count, edge, span, turn, fan, wrap, reduced }
    handlers.current = { albums, onChange, onPlayChange }
  })

  const layout = React.useCallback(() => {
    const { count, edge: S, span, turn, fan, wrap } = cfg.current
    const m = motion.current
    const pos = m.rail.pos
    const p = m.play.pos

    for (let i = 0; i < count; i++) {
      const card = cards.current[i]
      if (!card) continue
      const pose = sleevePose(railOffset(i, pos, count, wrap), span, turn, fan)
      card.style.transform =
        `translate3d(${((pose.x + pose.shift * p) * S).toFixed(2)}px,${(pose.y * S).toFixed(2)}px,0) ` +
        `rotateZ(${pose.rotateZ.toFixed(2)}deg) rotateY(${pose.rotateY.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`
      card.style.opacity = pose.opacity.toFixed(3)

      const shown = pose.opacity > 0
      const last = m.written.get(card)
      if (!last || last.zIndex !== pose.zIndex || last.shown !== shown) {
        if (last?.zIndex !== pose.zIndex) card.style.zIndex = String(pose.zIndex)
        if (last?.shown !== shown) card.style.visibility = shown ? "visible" : "hidden"
        m.written.set(card, { zIndex: pose.zIndex, shown })
      }

      const shade = shades.current[i]
      if (shade) shade.style.opacity = pose.shade.toFixed(3)
      const record = records.current[i]
      if (record) record.style.transform = `translateX(${(p * RECORD_OUT * S * pose.record).toFixed(2)}px)`
    }

    // Ruler ticks scroll with the rail, one tick per album.
    ticks.current.forEach((tick, k) => {
      if (!tick) return
      const { x, opacity } = tickPose(k, pos, rulerHalf.current)
      tick.style.transform = `translateX(${x.toFixed(2)}px)`
      tick.style.opacity = opacity.toFixed(3)
    })
  }, [])

  const sync = React.useCallback(() => {
    const { count } = cfg.current
    if (!count) return
    const nearest = mod(Math.round(motion.current.rail.pos), count)
    if (nearest === activeRef.current) return
    activeRef.current = nearest
    setActive(nearest)
    handlers.current.onChange?.(nearest, handlers.current.albums[nearest])
  }, [])

  const stop = React.useCallback(() => {
    cancelAnimationFrame(motion.current.raf)
    motion.current.raf = 0
  }, [])

  const kick = React.useCallback(() => {
    const m = motion.current
    // Off screen and in a hidden tab nothing is scheduled; the move waits where it is.
    if (m.raf || !m.visible || document.hidden) return
    const frame = (now: number) => {
      m.raf = 0
      if (!m.visible || document.hidden) return
      m.clock += clamp(now - m.last, MIN_FRAME_MS, MAX_FRAME_MS)
      m.last = now
      const railMoving = sampleTween(m.rail, m.clock)
      const playMoving = sampleTween(m.play, m.clock)
      // The loop ends as soon as both moves have landed; a rail at rest costs nothing.
      if (railMoving || playMoving) m.raf = requestAnimationFrame(frame)
      layout()
      sync()
    }
    m.last = performance.now()
    m.raf = requestAnimationFrame(frame)
  }, [layout, sync])

  /** Carries on with a move that was waiting off screen or in a hidden tab. */
  const resume = React.useCallback(() => {
    const m = motion.current
    if (m.rail.active || m.play.active) kick()
  }, [kick])

  /** Starts a move, or jumps straight there when the user prefers reduced motion. */
  const animate = React.useCallback(
    (tw: Tween, to: number, dur: number) => {
      const m = motion.current
      const now = m.raf ? m.clock + clamp(performance.now() - m.last, 0, MAX_FRAME_MS) : m.clock
      retargetTween(tw, to, cfg.current.reduced ? 0 : dur, now)
      if (tw.active) return kick()
      layout()
      sync()
    },
    [kick, layout, sync]
  )

  const setPlay = React.useCallback(
    (on: boolean) => {
      if (playingRef.current === on) return
      playingRef.current = on
      setPlaying(on)
      animate(motion.current.play, on ? 1 : 0, on ? PLAY_OPEN_MS : PLAY_CLOSE_MS)
      const index = activeRef.current
      handlers.current.onPlayChange?.(on, index, handlers.current.albums[index])
    },
    [animate]
  )

  const moveTo = React.useCallback(
    (target: number, dur = RAIL_MS) => {
      setPlay(false)
      setNavCount((n) => n + 1)
      animate(motion.current.rail, target, dur)
    },
    [animate, setPlay]
  )

  const go = React.useCallback(
    (index: number) => {
      const { count, wrap } = cfg.current
      if (!count) return
      moveTo(railTarget(index, Math.round(motion.current.rail.to), count, wrap))
    },
    [moveTo]
  )

  const step = React.useCallback(
    (dir: number) => {
      const { count, wrap } = cfg.current
      const next = Math.round(motion.current.rail.to) + dir
      moveTo(wrap ? next : clamp(next, 0, count - 1))
    },
    [moveTo]
  )

  // Re-anchor when the album list or looping changes, so positions stay in range.
  React.useLayoutEffect(() => {
    if (!count) return
    stop()
    const rail = motion.current.rail
    Object.assign(rail, createTween(mod(Math.round(rail.to), count)))
    layout()
    sync()
  }, [count, wrap, layout, stop, sync])

  React.useLayoutEffect(() => {
    layout()
  }, [edge, span, turn, fan, showControls, layout])

  // Fit the sleeve, and the ruler's fade, to the container.
  React.useLayoutEffect(() => {
    const root = stageRef.current?.parentElement
    if (!root) return
    const measure = () => {
      setEdge(Math.round(Math.min(size, root.clientWidth * FIT)))
      if (rulerRef.current) rulerHalf.current = rulerRef.current.clientWidth / 2
      layout()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [size, showControls, hasAlbums, layout])

  // Off screen the rail does no work: autoplay holds and a move waits, and both carry on when it is back in view
  // or the tab is shown again.
  React.useEffect(() => {
    const root = stageRef.current?.parentElement
    if (!root) return
    const m = motion.current
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      m.visible = entry.isIntersecting
      setOffscreen(!entry.isIntersecting)
      resume()
    })
    observer.observe(root)
    document.addEventListener("visibilitychange", resume)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", resume)
      m.visible = true
    }
  }, [hasAlbums, resume])

  React.useEffect(() => stop, [stop])

  // Autoplay waits while a record is playing, and restarts its timer on every move, so manual navigation never gets
  // followed by an instant jump. Reduced motion turns it off.
  const paused = playing || (pauseOnHover && hovered) || focused || dragging || hidden || offscreen || reduced
  React.useEffect(() => {
    if (!autoplay || paused || count < 2) return
    const id = window.setTimeout(() => {
      if (!cfg.current.wrap && activeRef.current >= count - 1) go(0)
      else step(1)
    }, autoplay)
    return () => window.clearTimeout(id)
  }, [navCount, active, autoplay, paused, count, go, step])

  // Keep keyboard focus on the front sleeve as the rail moves.
  React.useEffect(() => {
    const root = stageRef.current?.parentElement
    const el = document.activeElement
    const target = sleeves.current[active]
    if (root && target && el instanceof HTMLElement && el !== target && root.contains(el) && el.dataset.slot === "album-rail-sleeve") {
      target.focus({ preventScroll: true })
    }
  }, [active])

  // Horizontal wheel or trackpad swipe. Vertical scrolling is left to the page.
  React.useEffect(() => {
    const root = stageRef.current?.parentElement
    if (!root) return
    let acc = 0
    let lastStep = 0
    let idle = 0
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const delta = horizontal ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!delta) return
      e.preventDefault()
      acc += delta
      window.clearTimeout(idle)
      idle = window.setTimeout(() => (acc = 0), WHEEL_IDLE)
      if (Math.abs(acc) > WHEEL_STEP && e.timeStamp - lastStep > WHEEL_GAP) {
        step(Math.sign(acc))
        acc = 0
        lastStep = e.timeStamp
      }
    }
    root.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      root.removeEventListener("wheel", onWheel)
      window.clearTimeout(idle)
    }
  }, [hasAlbums, step])

  // Dragging the sleeves or scrubbing the ruler. Move and up listen on window, so a drag keeps working when the
  // pointer leaves the rail; they only write the rail's position and wake the frame loop, which draws it.
  const drag = React.useRef({
    id: -1,
    kind: "rail" as "rail" | "ruler",
    x: 0,
    from: 0,
    moved: false,
    samples: [] as { x: number; t: number }[],
  })
  const suppressClick = React.useRef(false)

  React.useEffect(() => {
    const unitPx = () => (drag.current.kind === "ruler" ? TICK_GAP : cfg.current.edge * DRAG_UNIT)

    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (d.id !== e.pointerId) return
      if (!d.moved) {
        if (Math.abs(e.clientX - d.x) < DRAG_THRESHOLD) return
        d.moved = true
        d.x = e.clientX
        d.from = motion.current.rail.pos
        motion.current.rail.active = false
        setPlay(false)
        setDragging(true)
      }
      const { count, wrap } = cfg.current
      let pos = d.from - (e.clientX - d.x) / unitPx()
      if (!wrap) {
        // Rubber band past the ends.
        if (pos < 0) pos *= RUBBER_BAND
        else if (pos > count - 1) pos = count - 1 + (pos - (count - 1)) * RUBBER_BAND
      }
      const rail = motion.current.rail
      rail.pos = rail.to = pos
      rail.vel = 0
      d.samples.push({ x: e.clientX, t: e.timeStamp })
      if (d.samples.length > DRAG_SAMPLES) d.samples.shift()
      kick()
    }

    const onUp = (e: PointerEvent) => {
      const d = drag.current
      if (d.id !== e.pointerId) return
      d.id = -1

      if (!d.moved) {
        // A tap on the ruler jumps to the tapped tick.
        const ruler = rulerRef.current
        if (d.kind === "ruler" && ruler && e.type === "pointerup") {
          const r = ruler.getBoundingClientRect()
          const ticksAway = Math.round((e.clientX - (r.left + r.width / 2)) / TICK_GAP)
          if (ticksAway) step(ticksAway)
        }
        return
      }

      setDragging(false)
      suppressClick.current = true

      const recent = d.samples.filter((s) => e.timeStamp - s.t < FLING_WINDOW)
      let velocity = 0 // pixels per millisecond
      if (recent.length > 1) {
        const a = recent[0]
        const b = recent[recent.length - 1]
        velocity = (b.x - a.x) / Math.max(b.t - a.t, 1)
      }
      const { count, wrap } = cfg.current
      const unit = unitPx()
      const rail = motion.current.rail
      const target = flingTarget(rail.pos, velocity, unit, count, wrap)
      rail.vel = clamp((-velocity * 1000) / unit, -FLING_SPEED, FLING_SPEED)
      moveTo(target, RELEASE_MS)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [kick, moveTo, setPlay, step])

  const startDrag = (e: React.PointerEvent, kind: "rail" | "ruler") => {
    suppressClick.current = false
    if (e.button !== 0 || count < 2) return
    drag.current = {
      id: e.pointerId,
      kind,
      x: e.clientX,
      from: motion.current.rail.pos,
      moved: false,
      samples: [{ x: e.clientX, t: e.timeStamp }],
    }
  }

  const onSleeveClick = (index: number) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (index === activeRef.current) setPlay(!playingRef.current)
    else go(index)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Home") go(0)
    else if (e.key === "End") go(count - 1)
    else return
    e.preventDefault()
  }

  // Only keyboard focus holds autoplay; a mouse click that happens to focus a sleeve should not.
  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(e)
    if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) setFocused(true)
  }
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
  }

  const current = albums[active] ?? albums[0]
  const tint = useCoverColor(current?.cover, current?.color, accent)

  if (!count) return null
  const autoplaying = Boolean(autoplay) && !paused && count > 1

  return (
    <div
      data-slot="album-rail"
      role="region"
      aria-roledescription="carousel"
      aria-label="Albums"
      className={cn("relative w-full text-foreground select-none [-webkit-tap-highlight-color:transparent]", className)}
      style={{ ...style, "--rail-size": `${edge}px`, "--rail-accent": tint } as React.CSSProperties}
      onKeyDown={handleKeyDown}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (e.pointerType === "mouse") setHovered(true)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        setHovered(false)
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      <div
        ref={stageRef}
        className={cn(
          "relative h-[calc(var(--rail-size)*1.3)] touch-pan-y overflow-hidden [perspective:calc(var(--rail-size)*4.5)]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={(e) => startDrag(e, "rail")}
      >
        {albums.map((album, i) => {
          const isActive = i === active
          return (
            <div
              key={i}
              ref={(el) => {
                cards.current[i] = el
              }}
              data-slot="album-rail-card"
              className="group/card absolute top-1/2 left-1/2 mt-[calc(var(--rail-size)/-2)] ml-[calc(var(--rail-size)/-2)] size-(--rail-size) will-change-[transform,opacity]"
            >
              <div
                ref={(el) => {
                  records.current[i] = el
                }}
                aria-hidden="true"
                className="absolute inset-[3%] z-0 will-change-transform"
              >
                {/* Hover peek: the front record shows a sliver until it is played. */}
                <div
                  className={cn(
                    "size-full transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    isActive && !playing && "group-hover/card:[transform:translateX(9%)]"
                  )}
                >
                  {/* The light reflection on top stays put while the label spins underneath it. */}
                  <div className="relative size-full overflow-hidden rounded-full bg-[#131116] shadow-[0_calc(var(--rail-size)*0.04)_calc(var(--rail-size)*0.1)_calc(var(--rail-size)*-0.02)_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.08)] after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:[background:conic-gradient(from_25deg,transparent_0deg,rgba(255,255,255,0.12)_28deg,transparent_64deg,transparent_180deg,rgba(255,255,255,0.08)_212deg,transparent_248deg)]">
                    {/* The grooves are rings around the centre, so they hold still and only the label turns:
                        a layered background never sits on a transformed element. */}
                    <div className="absolute inset-0 rounded-full [background:radial-gradient(circle_closest-side,transparent_41%,rgba(255,255,255,0.07)_41.6%,transparent_42.6%),radial-gradient(circle_closest-side,transparent_58%,rgba(255,255,255,0.06)_58.6%,transparent_59.6%),radial-gradient(circle_closest-side,transparent_75%,rgba(255,255,255,0.06)_75.6%,transparent_76.6%),radial-gradient(circle_closest-side,transparent_95%,rgba(255,255,255,0.1)_96%,transparent_98%),repeating-radial-gradient(circle_closest-side,rgba(255,255,255,0.025)_0_1px,transparent_1px_3px)]">
                      <div
                        className={cn(
                          "absolute inset-0",
                          isActive && playing
                            ? "motion-safe:animate-[mewo-album-rail-spin_2.4s_linear_infinite]"
                            : "motion-safe:animate-[mewo-album-rail-spin_2.4s_linear_infinite_paused]"
                        )}
                      >
                        <span
                          className="absolute top-1/2 left-1/2 size-[34%] -translate-1/2 rounded-full bg-cover bg-center shadow-[0_0_0_2px_rgba(0,0,0,0.5)] after:absolute after:top-1/2 after:left-1/2 after:size-[9%] after:-translate-1/2 after:rounded-full after:bg-[#050505]"
                          style={{ backgroundImage: `url(${JSON.stringify(album.cover)})` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                ref={(el) => {
                  sleeves.current[i] = el
                }}
                type="button"
                data-slot="album-rail-sleeve"
                tabIndex={isActive ? 0 : -1}
                aria-label={isActive ? `${playing ? "Pause" : "Play"} ${album.title} by ${album.artist}` : `${album.title} by ${album.artist}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSleeveClick(i)}
                className="absolute inset-0 z-1 m-0 block cursor-[inherit] overflow-hidden rounded-[calc(var(--rail-size)*0.05)] border-0 bg-muted p-0 text-inherit shadow-[0_calc(var(--rail-size)*0.07)_calc(var(--rail-size)*0.14)_calc(var(--rail-size)*-0.03)_rgba(0,0,0,0.6)] [font:inherit] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                <img className="pointer-events-none block size-full object-cover [-webkit-user-drag:none]" src={album.cover} alt="" draggable={false} decoding="async" />
                <span className="pointer-events-none absolute inset-0 [background:linear-gradient(125deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_36%)]" />
                {/* Darkens sleeves as they move away from the front; the frame loop sets its opacity. */}
                <span
                  ref={(el) => {
                    shades.current[i] = el
                  }}
                  className="pointer-events-none absolute inset-0 bg-black opacity-0"
                />
              </button>
            </div>
          )
        })}
      </div>

      {showCaption && (
        <div className="mt-[calc(var(--rail-size)*-0.02)] min-h-[3.4em] text-center" aria-live={autoplaying ? "off" : "polite"} aria-atomic="true">
          <div key={active} className="motion-safe:animate-[mewo-album-rail-caption_0.5s_cubic-bezier(0.22,1,0.36,1)_both]">
            <p className="m-0 text-[1.05rem] font-semibold tracking-[-0.01em]">{current.title}</p>
            <p className="mt-[0.3em] mb-0 text-[0.875rem] opacity-55">{current.artist}</p>
          </div>
        </div>
      )}

      {showControls && (
        <div className="mt-[18px] flex items-center justify-center gap-[10px]">
          <button type="button" aria-label="Previous album" onClick={() => step(-1)} className={NAV_BUTTON}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className={NAV_ICON}>
              <path d="M10 3.5 5.5 8l4.5 4.5" />
            </svg>
          </button>

          <div
            ref={rulerRef}
            role="slider"
            tabIndex={0}
            aria-label="Choose album"
            aria-valuemin={1}
            aria-valuemax={count}
            aria-valuenow={active + 1}
            aria-valuetext={`${current.title} by ${current.artist}`}
            className="relative h-[38px] w-[min(306px,calc(100%_-_96px))] flex-none cursor-ew-resize touch-none rounded-[19px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerDown={(e) => {
              if (!(e.target as Element).closest('[data-slot="album-rail-play"]')) startDrag(e, "ruler")
            }}
          >
            {Array.from({ length: TICKS_PER_SIDE * 2 + 2 }, (_, k) => (
              <span
                key={k}
                ref={(el) => {
                  ticks.current[k] = el
                }}
                className="pointer-events-none absolute top-1/2 left-1/2 mt-[-4.5px] ml-[-0.75px] h-[9px] w-[1.5px] rounded-[1px] bg-current opacity-0 will-change-[transform,opacity]"
              />
            ))}
            {/* Tinted with the front cover's colour. */}
            <button
              type="button"
              data-slot="album-rail-play"
              aria-label={playing ? "Pause" : `Play ${current.title}`}
              aria-pressed={playing}
              onClick={() => setPlay(!playingRef.current)}
              className="absolute top-1/2 left-1/2 mt-[-19px] ml-[-19px] grid size-[38px] cursor-pointer place-items-center rounded-full border-0 bg-[color-mix(in_srgb,var(--rail-accent)_30%,transparent)] p-0 text-[color-mix(in_srgb,var(--rail-accent)_70%,var(--color-foreground))] outline-none [transition:background-color_0.6s,color_0.6s,transform_0.2s_cubic-bezier(0.22,1,0.36,1)] hover:[transform:scale(1.06)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring active:[transform:scale(0.94)]"
            >
              {playing ? (
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-[14px] fill-current">
                  <rect x="4" y="3.5" width="2.6" height="9" rx="0.8" />
                  <rect x="9.4" y="3.5" width="2.6" height="9" rx="0.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-[14px] fill-current">
                  <path d="M5.5 3.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L6.4 3.1a.6.6 0 0 0-.9.5Z" />
                </svg>
              )}
            </button>
          </div>

          <button type="button" aria-label="Next album" onClick={() => step(1)} className={NAV_BUTTON}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className={NAV_ICON}>
              <path d="M6 3.5 10.5 8 6 12.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
