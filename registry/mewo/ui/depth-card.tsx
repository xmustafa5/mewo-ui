"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DepthCardLayer {
  /** Image URL. */
  image: string
  /** Parallax multiplier: with the pointer at the card's edge the layer travels `maxTranslation` × `depth` pixels. */
  depth: number
}

export interface DepthCardProps extends Omit<React.ComponentProps<"div">, "title" | "onClick"> {
  /** Background image URL. Ignored when `layers` is set. */
  image?: string
  /** Several images stacked for a deeper parallax, later ones in front. Replaces `image`. */
  layers?: DepthCardLayer[]
  /** Heading at the bottom of the card, and its accessible name unless `ariaLabel` is set. It takes the place of the HTML `title` attribute, which the card does not pass on. */
  title?: string
  /** Line under the heading. */
  description?: string
  /** Card width in pixels. */
  width?: number
  /** Card height in pixels. */
  height?: number
  /** Tilt in degrees with the pointer at an edge. */
  maxRotation?: number
  /** Image travel in pixels with the pointer at an edge, times each layer's depth. */
  maxTranslation?: number
  /** Corner radius, as any CSS length. */
  borderRadius?: string
  /** Merged onto the block that holds the title and description. */
  contentClassName?: string
  /** Called on click. Without `href` it makes the card a button that Enter and Space also press. */
  onClick?: React.MouseEventHandler<HTMLElement>
  /** Makes the card a link. */
  href?: string
  /** Where the link opens. `_blank` adds `rel="noopener noreferrer"`. */
  target?: "_blank" | "_self" | "_parent" | "_top"
  /** Describes the image for screen readers. Without it the images are decorative. */
  imageAlt?: string
  /** Turn the tilt and the spotlight off on touch-first devices. */
  disableOnMobile?: boolean
  /** Accessible name of the card. Defaults to the title. */
  ariaLabel?: string
  /** Delay between the title's and the description's reveal, in milliseconds. */
  staggerDelay?: number
  /** How the text appears on hover or keyboard focus. */
  revealAnimation?: "slide" | "fade" | "scale" | "none"
  /** Keep the card flat and the spotlight off when the user prefers reduced motion. */
  respectReducedMotion?: boolean
  /** A soft light that follows the pointer. */
  spotlight?: boolean
  /** Colour at the centre of the light, as `rgb()` or `rgba()`. Its outer ring is the same colour at a fifth of the alpha. */
  spotlightColor?: string
}

const DEFAULT_IMAGE = "https://picsum.photos/seed/mewo-depth-card-1/480/640"

// The tilt covers 10% of the remaining distance per 60 fps frame. It is applied per elapsed second, so
// the ease takes the same time at 30, 60 or 144 fps.
const EASE_PER_FRAME = 0.1
// The images are drawn 30% larger than the card, so their parallax never shows an edge.
const IMAGE_SCALE = 1.3
// Every layer stacked on the first is drawn at this opacity, so the one under it shows through.
const BACK_LAYER_OPACITY = 0.6
// Radius of the spotlight in pixels: its circle has faded to nothing this far from the pointer.
const SPOTLIGHT_RADIUS = 600
// The tilt has settled once it is this close to its target, in half-card units.
const SETTLE_DISTANCE = 1e-4
// Frame time is clamped so a hitch or a background tab does not jump the ease.
const MIN_FRAME = 1 / 240
const MAX_FRAME = 0.05

// Where the title and the description wait until the card is hovered or focused, per reveal style.
const REVEAL_HIDDEN = {
  slide: { title: "translate-y-4 opacity-90", description: "translate-y-4 opacity-0" },
  fade: { title: "opacity-90", description: "opacity-0" },
  scale: { title: "scale-95 opacity-90", description: "scale-95 opacity-0" },
  none: { title: "", description: "" },
}

type Motion = {
  // Eased pointer position and its target, in −1…1 from the centre (x right, y down).
  x: number
  y: number
  tx: number
  ty: number
  // The latest pointer position in client pixels, read on the next frame.
  clientX: number
  clientY: number
  moved: boolean
  // Spotlight centre in card pixels, and whether it moved since it was last drawn.
  px: number
  py: number
  lit: boolean
  raf: number
  last: number
  // Props the frame reads, synced in an effect.
  maxRotation: number
  maxTranslation: number
  depths: number[]
  effects: boolean
  // Set by the setup effect: writes the current pose once.
  draw: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Share of the remaining distance the tilt covers in `dt` seconds: a tenth per 60 fps frame, at any frame rate. */
export function easeFactor(dt: number) {
  return 1 - Math.pow(1 - EASE_PER_FRAME, dt * 60)
}

/** The pointer at (`px`, `py`) pixels in a `width` × `height` card, as −1…1 from the centre (x right, y down). */
export function pointerTarget(px: number, py: number, width: number, height: number) {
  return {
    x: width > 0 ? clamp((px / width - 0.5) * 2, -1, 1) : 0,
    y: height > 0 ? clamp((py / height - 0.5) * 2, -1, 1) : 0,
  }
}

/** The card's tilt in degrees for a pointer at (`x`, `y`): the card dips where the pointer is. */
export function cardTilt(x: number, y: number, maxRotation: number) {
  return { rotateX: -y * maxRotation, rotateY: x * maxRotation }
}

/** A layer's offset in pixels for a pointer at (`x`, `y`): it slides away from the pointer, deeper layers further. */
export function layerShift(x: number, y: number, maxTranslation: number, depth: number) {
  return { x: -x * maxTranslation * depth, y: -y * maxTranslation * depth }
}

/** The spotlight's outer stop: the same colour at a fifth of its alpha (0.5 → 0.1 for the default white). */
export function fadedStop(color: string) {
  const m = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i)
  if (!m) return "rgba(255, 255, 255, 0.1)"
  const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${+(alpha * 0.2).toFixed(3)})`
}

function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query)
      list?.addEventListener("change", onChange)
      return () => list?.removeEventListener("change", onChange)
    },
    [query]
  )
  return React.useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false)
}

/**
 * The spotlight is a fixed radial gradient on an element twice the card's size, moved to the pointer with
 * a transform inside a card-sized layer that clips, blurs and blends it: the light is painted once and the
 * compositor slides it. The tilt and the parallax are transforms too, written from one frame loop that
 * stops as soon as the card has caught up with the pointer or eased back flat.
 */
export function DepthCard({
  image = DEFAULT_IMAGE,
  layers,
  title = "Quiet Ridge",
  description = "First light over the high pass.",
  width = 240,
  height = 320,
  maxRotation = 20,
  maxTranslation = 20,
  borderRadius = "10px",
  contentClassName,
  onClick,
  href,
  target = "_self",
  imageAlt,
  disableOnMobile = false,
  ariaLabel,
  staggerDelay = 75,
  revealAnimation = "slide",
  respectReducedMotion = true,
  spotlight = true,
  spotlightColor = "rgba(255, 255, 255, 0.5)",
  className,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: DepthCardProps) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
  const coarse = useMediaQuery("(hover: none) and (pointer: coarse)")
  // Reduced motion, or a touch-first device when asked, keeps the card flat and the spotlight off.
  const effects = !(respectReducedMotion && reduced) && !(disableOnMobile && coarse)
  const [active, setActive] = React.useState(false)
  const stack: DepthCardLayer[] = layers?.length ? layers : image ? [{ image, depth: 1 }] : []

  const cardRef = React.useRef<HTMLDivElement>(null)
  const layerRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const spotlightRef = React.useRef<HTMLDivElement>(null)
  const motionRef = React.useRef<Motion>({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    clientX: 0,
    clientY: 0,
    moved: false,
    px: 0,
    py: 0,
    lit: false,
    raf: 0,
    last: 0,
    maxRotation,
    maxTranslation,
    depths: [],
    effects,
    draw: () => {},
  })

  // The root becomes a new element when the card turns into a link or back, so the setup follows it.
  const isLink = Boolean(href)
  React.useLayoutEffect(() => {
    // The root's ref stays the consumer's, so the root is reached through the card.
    const card = cardRef.current
    const root = card?.parentElement
    if (!card || !root) return
    const m = motionRef.current

    const draw = () => {
      const { rotateX, rotateY } = cardTilt(m.x, m.y, m.maxRotation)
      card.style.transform = `rotateX(${rotateX.toFixed(4)}deg) rotateY(${rotateY.toFixed(4)}deg)`
      m.depths.forEach((depth, i) => {
        const layer = layerRefs.current[i]
        if (!layer) return
        const shift = layerShift(m.x, m.y, m.maxTranslation, depth)
        layer.style.transform = `translateX(${shift.x.toFixed(4)}px) translateY(${shift.y.toFixed(4)}px) scale(${IMAGE_SCALE})`
      })
      const light = spotlightRef.current
      if (light && m.lit) {
        light.style.transform = `translate3d(${m.px.toFixed(2)}px, ${m.py.toFixed(2)}px, 0)`
        m.lit = false
      }
    }

    const tick = (now: number) => {
      // dt is clamped so a hitch or a tab switch does not jump the ease.
      const dt = clamp((now - m.last) / 1000, MIN_FRAME, MAX_FRAME)
      m.last = now
      if (m.moved) {
        // Layout is read here, once a frame and before any write, rather than in the pointer listener.
        const rect = root.getBoundingClientRect()
        m.px = m.clientX - rect.left
        m.py = m.clientY - rect.top
        const target = pointerTarget(m.px, m.py, rect.width, rect.height)
        m.tx = target.x
        m.ty = target.y
        m.lit = true
        m.moved = false
      }
      const k = easeFactor(dt)
      m.x += (m.tx - m.x) * k
      m.y += (m.ty - m.y) * k
      const settled = Math.abs(m.tx - m.x) < SETTLE_DISTANCE && Math.abs(m.ty - m.y) < SETTLE_DISTANCE
      if (settled) {
        m.x = m.tx
        m.y = m.ty
      }
      draw()
      // The loop ends once the card has caught up with a still pointer or eased back flat: at rest it costs nothing.
      m.raf = settled ? 0 : requestAnimationFrame(tick)
    }

    const wake = () => {
      if (m.raf) return
      // The ease is timed from the moment its target changed.
      m.last = performance.now()
      m.raf = requestAnimationFrame(tick)
    }

    // Passive listeners that only note the pointer; the frame does the rest.
    const onPointerMove = (event: PointerEvent) => {
      if (!m.effects) return
      m.clientX = event.clientX
      m.clientY = event.clientY
      m.moved = true
      wake()
    }
    const onPointerEnter = () => setActive(true)
    const onPointerLeave = () => {
      setActive(false)
      m.moved = false
      m.tx = 0
      m.ty = 0
      if (m.effects) wake()
    }
    const options: AddEventListenerOptions = { passive: true }
    root.addEventListener("pointermove", onPointerMove, options)
    root.addEventListener("pointerenter", onPointerEnter, options)
    root.addEventListener("pointerleave", onPointerLeave, options)
    m.draw = draw
    if (m.x !== m.tx || m.y !== m.ty) wake()

    return () => {
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerenter", onPointerEnter)
      root.removeEventListener("pointerleave", onPointerLeave)
      cancelAnimationFrame(m.raf)
      // StrictMode remounts: a stale id would stop the loop from ever starting again.
      m.raf = 0
      m.draw = () => {}
    }
  }, [isLink])

  // Props reach the frame loop here, never during render. A stopped loop redraws at once so the card
  // shows new settings; a running one picks them up on its next frame.
  React.useLayoutEffect(() => {
    const m = motionRef.current
    m.maxRotation = maxRotation
    m.maxTranslation = maxTranslation
    m.depths = stack.map((layer) => layer.depth)
    m.effects = effects
    if (!effects) {
      // Effects switched off (reduced motion, a touch-first device): settle flat at once.
      cancelAnimationFrame(m.raf)
      m.raf = 0
      m.x = m.y = m.tx = m.ty = 0
      m.moved = false
    }
    if (!m.raf) m.draw()
  })

  // The root may be a link, so the handlers take any element; the consumer's are typed for the div.
  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
    onFocus?.(event as React.FocusEvent<HTMLDivElement>)
    // Keyboard focus reveals the text like a hover does.
    if (event.currentTarget.matches(":focus-visible")) setActive(true)
  }

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    onBlur?.(event as React.FocusEvent<HTMLDivElement>)
    setActive(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event as React.KeyboardEvent<HTMLDivElement>)
    if (href || !onClick || event.defaultPrevented) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  const hidden = active ? null : REVEAL_HIDDEN[revealAnimation]
  const textMotion =
    revealAnimation === "none" ? "transition-none" : "transition-[translate,scale,opacity] duration-500 ease-in-out motion-reduce:transition-opacity"
  const lightBackground = `radial-gradient(${SPOTLIGHT_RADIUS}px at 50% 50%, ${spotlightColor} 0%, ${fadedStop(spotlightColor)} 40%, transparent 100%)`

  // A div, a button when it has onClick, or a link when it has href. The rest props are typed for the div.
  const Root = (href ? "a" : "div") as React.ElementType
  const kind = href
    ? { href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined }
    : { role: onClick ? "button" : undefined, tabIndex: onClick ? 0 : undefined }

  return (
    <Root
      data-slot="depth-card"
      {...kind}
      aria-label={ariaLabel ?? (title || undefined)}
      className={cn(
        "relative block flex-none cursor-pointer overflow-hidden text-inherit no-underline outline-none perspective-[1000px] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-foreground/85 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      style={{ width, height, borderRadius, ...style }}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* The tilting surface. Its shadow is swapped, not transitioned: the surface's own clip-path hides it anyway. */}
      <div
        ref={cardRef}
        data-slot="depth-card-surface"
        className={cn(
          "relative size-full bg-muted backface-hidden transform-3d will-change-transform",
          active ? "shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
        )}
        style={{ borderRadius, clipPath: `inset(0px round ${borderRadius})` }}
      >
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius }} role={imageAlt ? "img" : undefined} aria-label={imageAlt}>
          {stack.map((layer, i) => (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el
              }}
              data-slot="depth-card-layer"
              // scale(1.3) is IMAGE_SCALE, for the first paint; the frame loop owns the transform after that.
              className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat backface-hidden will-change-transform [transform:scale(1.3)]"
              style={{ backgroundImage: `url(${JSON.stringify(layer.image)})`, zIndex: i, opacity: i === 0 ? 1 : BACK_LAYER_OPACITY }}
            />
          ))}
        </div>
        {spotlight && (
          // Card-sized and never transformed: it clips the light to the card, then blurs and blends it,
          // exactly as a card-sized gradient would be.
          <div
            aria-hidden
            data-slot="depth-card-spotlight"
            className={cn(
              "pointer-events-none absolute inset-0 z-20 overflow-hidden mix-blend-soft-light blur-[2px] transition-opacity duration-300 ease-out",
              active && effects ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Twice the card (capped at the light's 1200px diameter) and centred on the card's corner, so
                moved to any point of the card it still covers the card. It waits off the card until the
                pointer first moves over it. */}
            <div
              ref={spotlightRef}
              data-slot="depth-card-light"
              className="absolute top-0 left-0 size-[min(200%,1200px)] -translate-1/2 will-change-transform [transform:translate3d(-100%,-100%,0)]"
              style={{ backgroundImage: lightBackground }}
            />
          </div>
        )}
        <div
          data-slot="depth-card-content"
          className={cn("absolute inset-0 z-30 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/40 to-black/0 p-6", contentClassName)}
        >
          {/* The text sits on a dark scrim over the photo, so it stays light in either theme. */}
          {title && (
            <h3 className={cn("mb-2 text-2xl font-bold text-white", textMotion, revealAnimation === "scale" && "origin-bottom-left", hidden?.title)}>
              {title}
            </h3>
          )}
          {description && (
            <p
              className={cn("text-sm text-gray-200", textMotion, revealAnimation === "scale" && "origin-top-left", hidden?.description)}
              style={{ transitionDelay: `${staggerDelay}ms` }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </Root>
  )
}
