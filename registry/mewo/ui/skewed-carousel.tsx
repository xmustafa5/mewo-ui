"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkewedCarouselItem {
  /** Image URL. */
  image: string
  /** Caption under the active slide, and the slide's accessible name. */
  title: string
  /** Image description for screen readers. Defaults to the title. */
  alt?: string
}

export interface SkewedCarouselProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Slides, in order. */
  items?: SkewedCarouselItem[]
  /** Slide focused on mount. */
  initialIndex?: number
  /** Slide width in pixels. */
  cardWidth?: number
  /** Aspect ratio of each slide, as CSS `aspect-ratio`. */
  aspectRatio?: string
  /** Degrees each slide turns per step away from the active one. */
  rotation?: number
  /** Scale of every inactive slide. */
  inactiveScale?: number
  /** Perspective of each slide, in pixels. */
  perspective?: number
  /** Corner radius of the slides, in pixels. */
  borderRadius?: number
  /** Blur on inactive captions, in pixels. */
  titleBlur?: number
  /** Multiplier on the transition duration. 2 is twice as slow. */
  speed?: number
  /** Show the caption on the active slide. */
  showTitles?: boolean
  /** Show the previous and next buttons. */
  showControls?: boolean
  /** Show the progress dots. */
  showDots?: boolean
  /** Wrap around at either end. */
  loop?: boolean
  /** Advance on a timer. It holds while the pointer or keyboard focus is on the carousel, and off screen. */
  autoplay?: boolean
  /** Delay between automatic advances, in milliseconds. */
  autoplayDelay?: number
  /** A sideways drag of 45px or more moves one slide. */
  enableDrag?: boolean
  /** Left and right arrow keys move one slide while the carousel has focus. */
  enableKeyboard?: boolean
  /** Called with the active slide's index whenever it changes. */
  onIndexChange?: (index: number) => void
}

const DEFAULT_ITEMS: SkewedCarouselItem[] = [
  "Northern Light",
  "Paper Cranes",
  "Quiet Harbour",
  "Glass Garden",
  "Late Train",
  "Salt Flats",
  "Copper Hills",
  "Night Market",
  "Still Water",
  "Long Shadow",
].map((title, index) => ({ title, image: `https://picsum.photos/seed/mewo-skewed-${index + 1}/400/534` }))

// Springs, in rad/s at speed 1 and as a damping ratio. The strip overshoots a little, the slides barely.
const STRIP_SPRING = { omega: 11.25, zeta: 0.8 }
const SLIDE_SPRING = { omega: 8.5, zeta: 0.9 }
const DOT_SPRING = { omega: 20, zeta: 0.75 }
// A drag this long in pixels moves one slide, whatever the card width. The strip does not follow the pointer.
const SWIPE_DISTANCE = 45
// Inactive captions wait this many pixels below their place and rise as their slide arrives.
const CAPTION_DROP = 10
const DOT_GAP = 6
// Springs are integrated in fixed substeps so a slow frame does not change their shape.
const SUBSTEP = 1 / 240

type Spring = { x: number; v: number; target: number }
const spring = (x: number): Spring => ({ x, v: 0, target: x })

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Advances a damped spring by `dt` seconds. */
export function stepSpring(s: Spring, omega: number, zeta: number, dt: number) {
  for (let t = 0; t < dt - 1e-9; t += SUBSTEP) {
    const h = Math.min(SUBSTEP, dt - t)
    s.v += (omega * omega * (s.target - s.x) - 2 * zeta * omega * s.v) * h
    s.x += s.v * h
  }
}

/** Where a slide rests `offset` slides away from the active one: its turn, scale and caption drop. */
export function slidePose(offset: number, rotation: number, inactiveScale: number) {
  return {
    rotate: -offset * rotation,
    scale: offset === 0 ? 1 : inactiveScale,
    captionY: offset === 0 ? 0 : CAPTION_DROP,
  }
}

/** The slide a move to `index` lands on: wrapped when looping, held at the ends otherwise. */
export function landingIndex(index: number, count: number, loop: boolean) {
  if (count <= 0) return 0
  return loop ? ((index % count) + count) % count : clamp(index, 0, count - 1)
}

const settled = (s: Spring, eps: number) => Math.abs(s.target - s.x) < eps && Math.abs(s.v) < eps * 10

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  )
}

export function SkewedCarousel({
  items = DEFAULT_ITEMS,
  initialIndex = 3,
  cardWidth = 200,
  aspectRatio = "3 / 4",
  rotation = 60,
  inactiveScale = 0.85,
  perspective = 800,
  borderRadius = 8,
  titleBlur = 2,
  speed = 1,
  showTitles = true,
  showControls = true,
  showDots = true,
  loop = false,
  autoplay = false,
  autoplayDelay = 3000,
  enableDrag = true,
  enableKeyboard = true,
  onIndexChange,
  className,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: SkewedCarouselProps) {
  const count = items.length
  const [index, setIndex] = React.useState(() => landingIndex(initialIndex, count, false))
  const active = landingIndex(index, count, false)

  const stripRef = React.useRef<HTMLDivElement>(null)
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const captionRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const indicatorRef = React.useRef<HTMLSpanElement>(null)
  const onIndexChangeRef = React.useRef(onIndexChange)
  // On mount the strip starts at the first slide with every card flat, then springs to the initial slide.
  const motionRef = React.useRef({
    raf: 0,
    last: 0,
    wake: () => {},
    speed,
    strip: spring(0),
    dot: spring(active),
    slides: [] as { rotate: Spring; scale: Spring; captionY: Spring }[],
  })

  React.useEffect(() => {
    onIndexChangeRef.current = onIndexChange
    motionRef.current.speed = speed
  })

  const draw = React.useCallback(() => {
    const m = motionRef.current
    if (stripRef.current) stripRef.current.style.transform = Math.abs(m.strip.x) < 1e-3 ? "" : `translateX(${m.strip.x.toFixed(3)}px)`
    m.slides.forEach((s, i) => {
      const card = cardRefs.current[i]
      if (card) {
        const flat = Math.abs(s.rotate.x) < 1e-3 && Math.abs(s.scale.x - 1) < 1e-4
        card.style.transform = flat ? "" : `scale(${s.scale.x.toFixed(5)}) rotateY(${s.rotate.x.toFixed(4)}deg)`
      }
      const caption = captionRefs.current[i]
      if (caption) caption.style.transform = Math.abs(s.captionY.x) < 1e-3 ? "" : `translateY(${s.captionY.x.toFixed(4)}px)`
    })
    if (indicatorRef.current) indicatorRef.current.style.transform = `translateX(calc(${m.dot.x.toFixed(5)} * (100% + ${DOT_GAP}px)))`
  }, [])

  // The frame loop lives in one effect; prop changes only move the springs' targets and call wake().
  React.useLayoutEffect(() => {
    const m = motionRef.current
    const tick = (now: number) => {
      // dt is clamped so a hitch or a tab switch does not jump the springs.
      const dt = clamp((now - m.last) / 1000, 1 / 240, 0.05)
      m.last = now
      const k = 1 / Math.max(0.05, m.speed)
      const springs = [m.strip, m.dot, ...m.slides.flatMap((s) => [s.rotate, s.scale, s.captionY])]
      stepSpring(m.strip, STRIP_SPRING.omega * k, STRIP_SPRING.zeta, dt)
      stepSpring(m.dot, DOT_SPRING.omega * k, DOT_SPRING.zeta, dt)
      for (const s of m.slides) for (const sp of [s.rotate, s.scale, s.captionY]) stepSpring(sp, SLIDE_SPRING.omega * k, SLIDE_SPRING.zeta, dt)
      let moving = !settled(m.strip, 0.01) || !settled(m.dot, 1e-4)
      for (const s of m.slides) if (!settled(s.rotate, 0.005) || !settled(s.scale, 1e-5) || !settled(s.captionY, 0.005)) moving = true
      if (!moving) for (const sp of springs) Object.assign(sp, { x: sp.target, v: 0 })
      draw()
      // The loop ends as soon as everything has settled; a carousel at rest costs nothing.
      m.raf = moving ? requestAnimationFrame(tick) : 0
    }
    m.wake = () => {
      if (m.raf) return
      // The first step covers a full frame, so the move starts the moment the slide changes.
      m.last = performance.now() - 1000 / 60
      m.raf = requestAnimationFrame(tick)
    }
    return () => {
      cancelAnimationFrame(m.raf)
      m.raf = 0
      m.wake = () => {}
    }
  }, [draw])

  // A new slide or setting only moves the springs' targets and wakes the loop.
  React.useLayoutEffect(() => {
    const m = motionRef.current
    while (m.slides.length < count) m.slides.push({ rotate: spring(0), scale: spring(1), captionY: spring(0) })
    m.slides.length = count
    m.strip.target = -active * cardWidth
    m.dot.target = active
    m.slides.forEach((s, i) => {
      const pose = slidePose(i - active, rotation, inactiveScale)
      s.rotate.target = pose.rotate
      s.scale.target = pose.scale
      s.captionY.target = pose.captionY
    })
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    if (reduced) {
      for (const sp of [m.strip, m.dot, ...m.slides.flatMap((s) => [s.rotate, s.scale, s.captionY])]) Object.assign(sp, { x: sp.target, v: 0 })
      draw()
      return
    }
    draw()
    m.wake()
  }, [active, count, cardWidth, rotation, inactiveScale, showTitles, showDots, draw])

  const reported = React.useRef(active)
  React.useEffect(() => {
    if (reported.current === active) return
    reported.current = active
    onIndexChangeRef.current?.(active)
  }, [active])

  const goTo = React.useCallback((target: number) => setIndex(landingIndex(target, count, loop)), [count, loop])
  const canPrevious = loop || active > 0
  const canNext = loop || active < count - 1

  // Autoplay holds while the pointer or keyboard focus is on the carousel, off screen, and in a hidden tab.
  const [hold, setHold] = React.useState({ hover: false, focus: false, away: false })
  React.useEffect(() => {
    const root = stripRef.current?.closest<HTMLElement>('[data-slot="skewed-carousel"]')
    if (!root || !autoplay) return
    const onVisibility = () => setHold((h) => ({ ...h, away: document.hidden }))
    const observer = new IntersectionObserver(([entry]) => setHold((h) => ({ ...h, away: !entry.isIntersecting || document.hidden })))
    observer.observe(root)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [autoplay])
  const held = hold.hover || hold.focus || hold.away
  React.useEffect(() => {
    if (!autoplay || held || !canNext || count < 2) return
    // The timer restarts after every change, so a manual move never jumps straight on.
    const id = window.setTimeout(() => goTo(active + 1), Math.max(200, autoplayDelay))
    return () => window.clearTimeout(id)
  }, [autoplay, held, canNext, count, autoplayDelay, active, goTo])

  // Drag: nothing follows the pointer; on release a long enough swipe moves one slide.
  const dragRef = React.useRef<{ id: number; x: number; captured: boolean } | null>(null)
  const swallowClick = React.useRef(false)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enableDrag || (event.pointerType === "mouse" && event.button !== 0)) return
    dragRef.current = { id: event.pointerId, x: event.clientX, captured: false }
    swallowClick.current = false
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId || drag.captured) return
    // Capture only once it is clearly a drag, so a plain click still reaches the card under it.
    if (Math.abs(event.clientX - drag.x) > 5) {
      drag.captured = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
  }
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null
    const dx = event.clientX - drag.x
    if (Math.abs(dx) > 5) swallowClick.current = true
    if (Math.abs(dx) >= SWIPE_DISTANCE) goTo(active + (dx < 0 ? 1 : -1))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (!enableKeyboard || event.defaultPrevented || event.target !== event.currentTarget) return
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (direction === 0) return
    event.preventDefault()
    goTo(active + direction)
  }

  return (
    <div
      data-slot="skewed-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      tabIndex={0}
      className={cn(
        "relative flex w-full flex-col items-center overflow-hidden text-foreground outline-none select-none focus-visible:outline-2 focus-visible:outline-ring",
        className
      )}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.pointerType === "mouse") setHold((h) => ({ ...h, hover: true }))
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (event.pointerType === "mouse") setHold((h) => ({ ...h, hover: false }))
      }}
      onFocus={(event) => {
        onFocus?.(event)
        setHold((h) => ({ ...h, focus: event.target.matches(":focus-visible") }))
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHold((h) => ({ ...h, focus: false }))
      }}
      {...props}
    >
      <div style={{ width: cardWidth }}>
        <div
          ref={stripRef}
          className="flex w-fit touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragRef.current = null
          }}
          onClickCapture={(event) => {
            if (!swallowClick.current) return
            swallowClick.current = false
            event.stopPropagation()
            event.preventDefault()
          }}
        >
          {items.map((item, i) => {
            const isActive = i === active
            return (
              <div key={i} style={{ perspective }} aria-hidden={isActive ? undefined : true}>
                <div
                  ref={(el) => {
                    cardRefs.current[i] = el
                  }}
                  data-slot="skewed-carousel-card"
                  className="will-change-transform"
                  style={{ width: cardWidth, aspectRatio }}
                >
                  <button
                    type="button"
                    className="relative block size-full cursor-pointer overflow-hidden border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    style={{ borderRadius }}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={item.title}
                    aria-current={isActive}
                    onClick={() => goTo(i)}
                  >
                    <img className="block size-full object-cover [-webkit-user-drag:none]" src={item.image} alt={item.alt ?? item.title} draggable={false} />
                    {showTitles && (
                      <>
                        <span
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/80 via-black/30 to-transparent"
                          style={{ opacity: isActive ? 1 : 0 }}
                        />
                        <span
                          ref={(el) => {
                            captionRefs.current[i] = el
                          }}
                          className="pointer-events-none absolute inset-x-0 bottom-0 block px-3.5 pb-3 text-left text-sm leading-snug font-medium tracking-[-0.01em] text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]"
                          style={{ opacity: isActive ? 1 : 0, filter: isActive ? undefined : `blur(${titleBlur}px)` }}
                        >
                          {item.title}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(showControls || showDots) && (
        <div className="mt-9 flex items-center gap-4">
          {showControls && (
            <button
              type="button"
              aria-label="Previous slide"
              disabled={!canPrevious}
              onClick={() => goTo(active - 1)}
              className="grid cursor-pointer place-items-center rounded p-1 opacity-40 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-15"
            >
              <Chevron direction="left" />
            </button>
          )}
          {showDots && (
            <div className="relative flex w-44 items-center gap-1.5 sm:w-56">
              {items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show ${item.title}`}
                  aria-current={i === active}
                  onClick={() => goTo(i)}
                  className="relative h-0.5 flex-1 cursor-pointer rounded-full bg-current/20 transition-colors duration-200 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:bg-current/45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                />
              ))}
              <span
                ref={indicatorRef}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-0 -mt-px h-0.5 rounded-full bg-current"
                style={{ width: `calc((100% - ${Math.max(0, count - 1)} * ${DOT_GAP}px) / ${Math.max(1, count)})` }}
              />
            </div>
          )}
          {showControls && (
            <button
              type="button"
              aria-label="Next slide"
              disabled={!canNext}
              onClick={() => goTo(active + 1)}
              className="grid cursor-pointer place-items-center rounded p-1 opacity-40 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-15"
            >
              <Chevron direction="right" />
            </button>
          )}
        </div>
      )}

      <span className="sr-only" aria-live={autoplay && !held ? "off" : "polite"}>
        {count ? `Slide ${active + 1} of ${count}: ${items[active].title}` : ""}
      </span>
    </div>
  )
}
