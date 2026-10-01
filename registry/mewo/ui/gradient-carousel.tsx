"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface GradientCarouselProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Image URLs shown as cards. The backdrop takes its colours out of whichever card is nearest the centre. */
  images?: string[]
  /** Most a card turns, in degrees, as it moves away from the centre. */
  maxRotationDegrees?: number
  /** How far forward, in pixels, the centre card sits ahead of the ones at the edge. */
  maxDepthPx?: number
  /** Scale cards shrink to as they move away from the centre, 0 to 1. */
  minScale?: number
  /** Gap between cards in pixels. */
  cardGap?: number
  /** Velocity kept per frame, 0.5 to 0.99. Lower values stop the glide sooner. */
  frictionFactor?: number
  /** Multiplier on wheel movement. 0 leaves the wheel to the page. */
  wheelSensitivity?: number
  /** Multiplier on drag movement. */
  dragSensitivity?: number
  /** Blur applied to the gradient backdrop, in pixels. */
  backgroundBlur?: number
  /** Radius of the backdrop's colour pools, 0 to 1. */
  gradientSize?: number
  /** Opacity of the backdrop's colour pools, 0 to 1. */
  gradientIntensity?: number
  /** Move one card per press of the left and right arrow keys while the carousel has focus. */
  enableKeyboard?: boolean
  /** Called with the index of the card nearest the centre whenever it changes. */
  onCardChange?: (index: number) => void
  /** Width to height ratio of each card. */
  cardAspectRatio?: number
  /** Card centred when the carousel first renders. */
  initialIndex?: number
}

type Rgb = [number, number, number]
type Palette = [Rgb, Rgb]

const DEFAULT_IMAGES = Array.from({ length: 8 }, (_, index) => `https://picsum.photos/seed/mewo-carousel-${index + 1}/640/800`)

// Scale of the centre card; it reads larger than this because it also sits forward.
const CENTRE_SCALE = 0.95
// Cards soften over the last stretch before the stage edge.
const EDGE_BLUR = 2
const BLUR_START = 0.85
// Share of a wheel tick that becomes velocity, in pixels per frame.
const WHEEL_IMPULSE = 0.32
// Below this many pixels per frame the glide is over.
const MIN_VELOCITY = 0.02
// A drag held still this long before release has no speed left to carry.
const FLING_TIMEOUT = 80
// Images are read at this size to find their colours.
const SAMPLE_SIZE = 16
// The backdrop is blurred anyway, so it is drawn at a fraction of the stage's size.
const CANVAS_SCALE = 4
const POOL_RADIUS = 0.75
const NEUTRAL: Palette = [
  [128, 128, 128],
  [96, 96, 96],
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const modulo = (value: number, count: number) => ((value % count) + count) % count

/** Wraps a card's distance to the centre, in cards, into the loop [-count / 2, count / 2). */
export function wrapOffset(value: number, count: number): number {
  if (count <= 0) return 0
  return modulo(value + count / 2, count) - count / 2
}

/** How a card sits for a distance of 0 at the centre to 1 at the stage edge or beyond. */
export function carouselPose(distance: number, maxRotation: number, maxDepth: number, minScale: number) {
  const d = clamp(Math.abs(distance), 0, 1)
  return {
    rotate: maxRotation * d,
    depth: maxDepth * (1 - d),
    scale: CENTRE_SCALE + (minScale - CENTRE_SCALE) * d,
    blur: EDGE_BLUR * clamp((d - BLUR_START) / (1 - BLUR_START), 0, 1),
  }
}

/** The two most common colours in RGBA pixel data, the second chosen to differ visibly. */
export function extractPalette(pixels: ArrayLike<number>): Palette {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue
    // Three bits per channel groups near-identical shades into one bucket.
    const key = ((pixels[i] >> 5) << 6) | ((pixels[i + 1] >> 5) << 3) | (pixels[i + 2] >> 5)
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
    bucket.r += pixels[i]
    bucket.g += pixels[i + 1]
    bucket.b += pixels[i + 2]
    bucket.n += 1
    buckets.set(key, bucket)
  }

  const colours = [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .map(({ r, g, b, n }): Rgb => [Math.round(r / n), Math.round(g / n), Math.round(b / n)])
  if (colours.length === 0) return NEUTRAL

  const [first] = colours
  const second = colours.find((colour) => Math.hypot(colour[0] - first[0], colour[1] - first[1], colour[2] - first[2]) > 60)
  return [first, second ?? first]
}

const blend = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function GradientCarousel({
  images = DEFAULT_IMAGES,
  maxRotationDegrees = 28,
  maxDepthPx = 140,
  minScale = 0.92,
  cardGap = 28,
  frictionFactor = 0.9,
  wheelSensitivity = 0.6,
  dragSensitivity = 1,
  backgroundBlur = 24,
  gradientSize = 0.65,
  gradientIntensity = 0.7,
  enableKeyboard = true,
  onCardChange,
  cardAspectRatio = 0.8,
  initialIndex = 0,
  className,
  ...props
}: GradientCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const palettesRef = React.useRef<(Palette | null)[]>([])
  const repaintRef = React.useRef<(() => void) | null>(null)
  // Where the carousel has been turned to, in cards, kept across prop changes.
  const positionRef = React.useRef<number | null>(null)
  const activeRef = React.useRef(-1)
  const onCardChangeRef = React.useRef(onCardChange)

  React.useEffect(() => {
    onCardChangeRef.current = onCardChange
  }, [onCardChange])

  const count = images.length
  const start = count > 0 ? modulo(Math.round(initialIndex), count) : 0

  React.useEffect(() => {
    palettesRef.current = images.map(() => null)
    const sample = document.createElement("canvas")
    sample.width = sample.height = SAMPLE_SIZE
    const context = sample.getContext("2d", { willReadFrequently: true })
    if (!context) return

    const loaders = images.map((src, index) => {
      const image = new Image()
      // Reading pixels needs the image served with CORS headers. Without them the card
      // still shows and the backdrop keeps its neutral glow.
      image.crossOrigin = "anonymous"
      image.onload = () => {
        try {
          context.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
          palettesRef.current[index] = extractPalette(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data)
          repaintRef.current?.()
        } catch {
          // The canvas was tainted after all; the neutral palette stays.
        }
      }
      image.src = src
      return image
    })

    return () => {
      for (const image of loaders) image.onload = null
    }
  }, [images])

  React.useEffect(() => {
    const track = trackRef.current
    // The root's ref stays the consumer's, so the root is reached through the track.
    const root = track?.parentElement
    const canvas = canvasRef.current
    if (!track || !root || count === 0) return

    // Reduced motion keeps every control but drops the glide and the drifting backdrop.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const friction = clamp(frictionFactor, 0.5, 0.99)
    const context = canvas?.getContext("2d") ?? null

    let step = 1
    let half = 1
    let position = positionRef.current ?? start
    // Pixels per frame at 60 frames a second, the unit `frictionFactor` is defined in.
    let velocity = 0
    let fling = 0
    let lastX = 0
    let lastMove = 0
    let dragging = false
    let visible = true
    let clock = 0
    let raf = 0
    let last = 0

    const measure = () => {
      step = (cardRefs.current[0]?.offsetWidth ?? 0) + cardGap || 1
      half = root.clientWidth / 2 || 1
      if (canvas) {
        canvas.width = Math.max(1, Math.round(root.clientWidth / CANVAS_SCALE))
        canvas.height = Math.max(1, Math.round(root.clientHeight / CANVAS_SCALE))
      }
    }

    const pose = () => {
      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i]
        if (!card) continue
        const x = wrapOffset(i - position, count) * step
        const { rotate, depth, scale, blur } = carouselPose(x / half, maxRotationDegrees, maxDepthPx, minScale)
        // Cards turn to face the centre: the outer edge comes forward.
        card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, ${depth}px) rotateY(${-Math.sign(x) * rotate}deg) scale(${scale})`
        card.style.zIndex = `${Math.round(depth)}`
        card.style.filter = blur > 0.01 ? `blur(${blur}px)` : ""
      }

      const active = modulo(Math.round(position), count)
      if (active !== activeRef.current) {
        const mounting = activeRef.current === -1
        activeRef.current = active
        if (!mounting) onCardChangeRef.current?.(active)
      }
    }

    const pool = (colour: Rgb, x: number, y: number, radius: number, alpha: number) => {
      if (!context) return
      const [r, g, b] = colour.map(Math.round)
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
      context.fillStyle = gradient
      context.fillRect(0, 0, context.canvas.width, context.canvas.height)
    }

    const paint = () => {
      if (!context) return
      const { width, height } = context.canvas
      context.clearRect(0, 0, width, height)
      const radius = Math.max(width, height) * POOL_RADIUS * clamp(gradientSize, 0, 1)
      if (radius <= 0) return

      // The colours slide between the two cards either side of the centre.
      const base = Math.floor(position)
      const mix = position - base
      const near = palettesRef.current[modulo(base, count)] ?? NEUTRAL
      const next = palettesRef.current[modulo(base + 1, count)] ?? NEUTRAL
      const alpha = clamp(gradientIntensity, 0, 1)
      pool(blend(near[0], next[0], mix), width * (0.32 + 0.08 * Math.sin(clock * 0.31)), height * (0.4 + 0.1 * Math.cos(clock * 0.23)), radius, alpha)
      pool(blend(near[1], next[1], mix), width * (0.68 + 0.08 * Math.cos(clock * 0.27)), height * (0.6 + 0.1 * Math.sin(clock * 0.19)), radius, alpha)
    }

    const show = () => {
      positionRef.current = position
      pose()
      paint()
    }

    const tick = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1)
      last = now
      const frames = dt * 60

      if (Math.abs(velocity) > MIN_VELOCITY) {
        // The exact distance covered while the velocity decays, whatever the frame rate.
        position += (velocity * (Math.pow(friction, frames) - 1)) / Math.log(friction) / step
        velocity *= Math.pow(friction, frames)
      } else {
        velocity = 0
      }

      clock += dt
      show()
      raf = visible ? requestAnimationFrame(tick) : 0
    }

    const wake = () => {
      if (reduced) {
        show()
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (wheelSensitivity <= 0) return
      // The loop has no end to scroll past, so the wheel is taken while the pointer is over it.
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1
      const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit
      if (reduced) position += (delta * wheelSensitivity) / step
      else velocity += delta * wheelSensitivity * WHEEL_IMPULSE
      wake()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return
      dragging = true
      lastX = event.clientX
      lastMove = performance.now()
      velocity = 0
      fling = 0
      root.setPointerCapture?.(event.pointerId)
      root.style.cursor = "grabbing"
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return
      const dx = (event.clientX - lastX) * dragSensitivity
      lastX = event.clientX
      lastMove = performance.now()
      position -= dx / step
      // Averaging tames a jittery last sample before it becomes the glide's speed.
      fling = fling * 0.6 - dx * 0.4
      wake()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId)
      root.style.cursor = ""
      if (!reduced && performance.now() - lastMove < FLING_TIMEOUT) velocity = fling
      wake()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
      if (direction === 0) return
      event.preventDefault()
      // Either way a press travels exactly one card.
      if (reduced) position = Math.round(position) + direction
      else velocity += direction * step * -Math.log(friction)
      wake()
    }

    measure()
    show()
    repaintRef.current = paint
    wake()

    const resizeObserver = new ResizeObserver(() => {
      measure()
      show()
    })
    resizeObserver.observe(root)
    // The backdrop drifts for as long as the carousel is on screen, and no longer.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    intersectionObserver.observe(root)

    root.addEventListener("wheel", onWheel, { passive: false })
    root.addEventListener("pointerdown", onPointerDown)
    root.addEventListener("pointermove", onPointerMove)
    root.addEventListener("pointerup", onPointerUp)
    root.addEventListener("pointercancel", onPointerUp)
    if (enableKeyboard) root.addEventListener("keydown", onKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      repaintRef.current = null
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      root.removeEventListener("wheel", onWheel)
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("pointercancel", onPointerUp)
      root.removeEventListener("keydown", onKeyDown)
    }
  }, [count, start, maxRotationDegrees, maxDepthPx, minScale, cardGap, frictionFactor, wheelSensitivity, dragSensitivity, gradientSize, gradientIntensity, enableKeyboard])

  return (
    <div
      data-slot="gradient-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      tabIndex={enableKeyboard ? 0 : undefined}
      className={cn(
        "relative h-[600px] w-full cursor-grab touch-pan-y overflow-hidden bg-background select-none [perspective:1800px] focus-visible:outline-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        style={{ filter: `blur(${Math.max(0, backgroundBlur)}px) saturate(1.05)` }}
      />
      <div ref={trackRef} className="absolute inset-0 [transform-style:preserve-3d]">
        {images.map((src, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            data-slot="gradient-carousel-card"
            aria-hidden
            className="absolute top-1/2 left-1/2 w-[26%] max-w-[360px] min-w-32 rounded-[32px] bg-muted bg-cover bg-center shadow-2xl [backface-visibility:hidden] will-change-transform"
            style={{
              aspectRatio: cardAspectRatio,
              backgroundImage: `url(${JSON.stringify(src)})`,
              // A flat row for the first paint and for scripting off; the effect poses it in 3D.
              transform: `translate3d(calc(-50% + ${wrapOffset(i - start, count)} * (100% + ${cardGap}px)), -50%, 0)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
