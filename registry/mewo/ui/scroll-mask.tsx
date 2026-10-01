"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ScrollMaskVariant = "iris" | "wipe" | "curtain" | "slats" | "grid" | "type"

export interface ScrollMaskProps extends React.ComponentProps<"section"> {
  /** Which mask geometry drives the reveal. */
  variant?: ScrollMaskVariant
  /** Image revealed through the mask. */
  src?: string
  /** Alternative text for the image. */
  alt?: string
  /** Word carved out of the frame in the type variant. */
  word?: string
  /** Scroll runway beyond the pinned viewport, in viewport heights. */
  scrollLength?: number
  /** Fraction of the runway after which the reveal has fully opened. */
  settle?: number
  /** Seconds the reveal trails the scroll position. 0 snaps instantly. */
  smooth?: number
  /** Edge softness of the mask, as a percentage of the frame. */
  feather?: number
  /** Delay spread across pieces. 0 fires them together. */
  stagger?: number
  /** Strip count for slats, column count for grid. */
  columns?: number
  /** Horizontal anchor of the reveal, as a percentage. */
  originX?: number
  /** Vertical anchor of the reveal, as a percentage. */
  originY?: number
  /** Sweep direction of the wipe variant, in degrees. */
  angle?: number
  /** Scale the image starts at before settling back to 1. */
  zoom?: number
  /** How the image fills the frame. */
  fit?: "cover" | "contain"
  /** Corner radius of the frame, in pixels. */
  radius?: number
  /** Opacity of the scrim laid over the image. */
  overlay?: number
  /** Colour behind the frame. */
  background?: string
  /** Fade children in as the reveal completes. */
  revealContent?: boolean
  /** Hold the reveal steady on the scroll position instead of damping toward it. */
  calm?: boolean
}

const DEFAULT_SRC = "https://picsum.photos/seed/mewo-scroll-mask/1600/1000"

// Stops used to draw one feathered mask edge.
const FEATHER_STEPS = 14
// Slats slide in this far, as a percentage of their height, and reach full
// opacity a little before they land.
const SLAT_TRAVEL = 62
const SLAT_FADE = 1.9
// Grid cells grow out of this scale as they fade in.
const CELL_SCALE = 0.9
// The word starts at this fraction of its final size; the rest of the frame
// fills in once the reveal is past TYPE_FILL_START.
const TYPE_SCALE = 0.42
const TYPE_FILL_START = 0.54
// Children fade in across this stretch of the eased reveal, rising as they do.
const CONTENT_START = 0.5
const CONTENT_END = 0.94
const CONTENT_RISE = 20

const HIDDEN_MASK = "linear-gradient(transparent, transparent)"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothstep = (t: number) => t * t * (3 - 2 * t)
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/**
 * Where the opaque edge of the mask sits, as a percentage of the frame, for an eased
 * reveal of 0 to 1. It starts two feathers out of sight and ends at the far side.
 */
export function maskEdge(eased: number, feather: number): number {
  return -2 * feather + (100 + 2 * feather) * eased
}

/** Gradient stops that stay opaque up to `edge`%, then fall away over `feather`%. */
function featheredStops(edge: number, feather: number): string {
  if (feather <= 0) return `#000 ${edge.toFixed(2)}%, transparent ${edge.toFixed(2)}%`
  const stops: string[] = []
  for (let i = 0; i <= FEATHER_STEPS; i++) {
    const u = i / FEATHER_STEPS
    stops.push(`rgba(0,0,0,${(1 - smootherstep(u)).toFixed(3)}) ${(edge + feather * u).toFixed(2)}%`)
  }
  return stops.join(", ")
}

/** An SVG mask with the word stretched across its full width. */
function wordMask(word: string): string {
  const text = word.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
  const width = Math.max(1, Array.from(word).length) * 126
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 264">` +
    `<text x="${width / 2}" y="197" text-anchor="middle" textLength="${width - 12}" lengthAdjust="spacingAndGlyphs" ` +
    `font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="200" font-weight="800">` +
    `${text}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function setMask(el: HTMLElement, image: string, size = "100% 100%", position = "0 0") {
  for (const prefix of ["", "-webkit-"]) {
    el.style.setProperty(`${prefix}mask-image`, image)
    el.style.setProperty(`${prefix}mask-size`, size)
    el.style.setProperty(`${prefix}mask-position`, position)
    el.style.setProperty(`${prefix}mask-repeat`, "no-repeat")
  }
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

export function ScrollMask({
  variant = "iris",
  src = DEFAULT_SRC,
  alt = "",
  word = "SCROLL",
  scrollLength = 1.7,
  settle = 0.84,
  smooth = 0.14,
  feather = 14,
  stagger = 0.55,
  columns = 9,
  originX = 50,
  originY = 50,
  angle = 108,
  zoom = 1.14,
  fit = "cover",
  radius = 18,
  overlay = 0,
  background = "transparent",
  revealContent = true,
  calm = false,
  children,
  className,
  style,
  ...props
}: ScrollMaskProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const layerRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLDivElement>(null)
  const pieceRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const contentRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef<number | null>(null)

  const pieced = variant === "slats" || variant === "grid"
  const cols = Math.max(1, Math.floor(columns))
  // Grid rows follow the frame's shape so the cells stay close to square.
  const [gridRows, setGridRows] = React.useState(cols)
  const rows = variant === "grid" ? gridRows : 1
  const hasContent = children != null && children !== false
  const scrim = clamp(overlay, 0, 1)

  const pieces = React.useMemo(
    () => (pieced ? Array.from({ length: cols * rows }, (_, i) => ({ col: i % cols, row: Math.floor(i / cols) })) : []),
    [pieced, cols, rows]
  )

  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame || variant !== "grid") return

    // An observer reports the frame's size once on observing, then on every change.
    const observer = new ResizeObserver(() => {
      if (frame.clientWidth > 0) setGridRows(Math.max(1, Math.round((cols * frame.clientHeight) / frame.clientWidth)))
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [variant, cols])

  React.useEffect(() => {
    const stage = stageRef.current
    // The root's ref stays the consumer's, so the section is reached through the stage.
    const section = stage?.parentElement
    if (!stage || !section) return

    const scroller = scrollParent(section)
    // Inside a scroll container the stage pins to that container, not the window.
    const fitViewport = () => {
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
    }
    fitViewport()

    const settleAt = clamp(settle, 0.01, 1)
    const soft = Math.max(0, feather)
    const spread = clamp(stagger, 0, 0.95)
    const ox = originX / 100
    const oy = originY / 100
    const mask = variant === "type" ? wordMask(word) : ""

    // Pieces further out start later, the furthest by `stagger`.
    const distances = pieces.map(({ col, row }) =>
      variant === "slats"
        ? Math.abs((col + 0.5) / cols - ox)
        : Math.hypot((col + 0.5) / cols - ox, (row + 0.5) / rows - oy)
    )
    const reach = Math.max(1e-6, ...distances)

    const render = (progress: number) => {
      const eased = smoothstep(clamp(progress / settleAt, 0, 1))
      const imageScale = zoom + (1 - zoom) * eased
      const layer = layerRef.current
      const image = imageRef.current

      if (layer && image) {
        const edge = maskEdge(eased, soft)
        const stops = featheredStops(edge, soft)

        if (variant === "type") {
          const scale = TYPE_SCALE + (1 - TYPE_SCALE) * eased
          const alpha = clamp((eased - TYPE_FILL_START) / (1 - TYPE_FILL_START), 0, 1).toFixed(3)
          layer.style.transformOrigin = image.style.transformOrigin = `${originX}% ${originY}%`
          layer.style.transform = `scale(${scale})`
          // Counter-scale so the picture holds still while the word grows.
          image.style.transform = `scale(${imageScale / scale})`
          if (eased >= 1) setMask(layer, "none")
          else
            setMask(
              layer,
              `${mask}, linear-gradient(rgba(0,0,0,${alpha}), rgba(0,0,0,${alpha}))`,
              "contain, 100% 100%",
              `${originX}% ${originY}%, 0 0`
            )
        } else {
          image.style.transform = `scale(${imageScale})`
          if (eased >= 1) setMask(layer, "none")
          else if (edge + soft <= 0) setMask(layer, HIDDEN_MASK)
          else if (variant === "iris") setMask(layer, `radial-gradient(circle farthest-corner at ${originX}% ${originY}%, ${stops})`)
          else if (variant === "wipe") setMask(layer, `linear-gradient(${angle}deg, ${stops})`)
          else
            setMask(
              layer,
              `linear-gradient(to left, ${stops}), linear-gradient(to right, ${stops})`,
              `calc(${originX}% + 1px) 100%, calc(${100 - originX}% + 1px) 100%`,
              "left top, right top"
            )
        }
      }

      for (let i = 0; i < pieces.length; i++) {
        const piece = pieceRefs.current[i]
        if (!piece) continue
        const delay = (distances[i] / reach) * spread
        const local = smoothstep(clamp((eased - delay) / (1 - spread), 0, 1))

        if (variant === "slats") {
          const side = i % 2 === 0 ? -1 : 1
          piece.style.transform = `translate3d(0, ${side * SLAT_TRAVEL * (1 - local)}%, 0)`
          piece.style.opacity = `${Math.min(1, local * SLAT_FADE)}`
        } else {
          piece.style.transform = `scale(${CELL_SCALE + (1 - CELL_SCALE) * local})`
          piece.style.opacity = `${local}`
        }
      }

      const content = contentRef.current
      if (content) {
        const shown = revealContent ? smoothstep(clamp((eased - CONTENT_START) / (CONTENT_END - CONTENT_START), 0, 1)) : 1
        content.style.opacity = `${shown}`
        content.style.transform = `translate3d(0, ${(1 - shown) * CONTENT_RISE}px, 0)`
        content.style.visibility = shown > 0 ? "visible" : "hidden"
      }
    }

    // Reduced motion skips the reveal: CSS drops the scroll runway and the frame rests open.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1)
      return
    }

    const damping = calm ? 0 : Math.max(0, smooth)
    let target = 0
    let raf = 0
    let last = 0

    const measure = () => {
      const origin = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0
      const scrolled = origin - section.getBoundingClientRect().top
      const runway = section.offsetHeight - stage.offsetHeight
      target = runway > 0 ? clamp(scrolled / runway, 0, 1) : 0
    }

    const tick = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1)
      last = now

      let progress = progressRef.current ?? target
      progress = damping > 0 ? progress + (target - progress) * (1 - Math.exp(-dt / damping)) : target
      if (Math.abs(target - progress) < 0.0002) progress = target

      progressRef.current = progress
      render(progress)
      raf = progress === target ? 0 : requestAnimationFrame(tick)
    }

    const update = () => {
      measure()
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const resize = () => {
      fitViewport()
      update()
    }

    measure()
    // Snap on mount; afterwards keep the eased position across prop changes.
    progressRef.current = progressRef.current ?? target
    render(progressRef.current)
    if (progressRef.current !== target) update()

    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    if (scroller) observer.observe(scroller)
    // Scroll events do not bubble; capturing on the window hears a nested scroller too.
    window.addEventListener("scroll", update, { passive: true, capture: true })
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", update, { capture: true })
      window.removeEventListener("resize", resize)
    }
  }, [variant, word, scrollLength, settle, smooth, feather, stagger, cols, rows, pieces, originX, originY, angle, zoom, revealContent, calm, hasContent])

  const picture: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(0,0,0,${scrim}), rgba(0,0,0,${scrim})), url(${JSON.stringify(src)})`,
    backgroundSize: `auto, ${fit}`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }
  // The picture is painted as a background so slats and cells can each show their own
  // window onto it; this is what gives it a name for assistive tech.
  const labelled = alt ? ({ role: "img", "aria-label": alt } as const) : ({ "aria-hidden": true } as const)

  return (
    <section
      data-slot="scroll-mask"
      className={cn(
        "relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-[var(--mewo-viewport,100vh)]",
        className
      )}
      style={{ "--mewo-length": 1 + Math.max(0, scrollLength), background, ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={stageRef} className="sticky top-0 box-border h-[var(--mewo-viewport,100vh)] w-full p-[clamp(16px,5vw,32px)]">
        <div ref={frameRef} className="relative size-full overflow-hidden" style={{ borderRadius: radius }}>
          {pieced ? (
            <div key={variant} {...labelled} className="absolute inset-0">
              {pieces.map(({ col, row }, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    pieceRefs.current[i] = el
                  }}
                  data-slot="scroll-mask-piece"
                  // Clipping half a pixel outside the cell lets neighbours overlap, so no hairline seams show.
                  className="absolute opacity-0 [clip-path:inset(-0.5px)] will-change-[transform,opacity]"
                  style={{
                    left: `${(col / cols) * 100}%`,
                    top: `${(row / rows) * 100}%`,
                    width: `${100 / cols}%`,
                    height: `${100 / rows}%`,
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${-col * 100}%`,
                      top: `${-row * 100}%`,
                      width: `${cols * 100}%`,
                      height: `${rows * 100}%`,
                      ...picture,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              key={variant}
              ref={layerRef}
              data-slot="scroll-mask-layer"
              className="absolute inset-0 will-change-transform"
              style={{ maskImage: HIDDEN_MASK, WebkitMaskImage: HIDDEN_MASK }}
            >
              <div
                ref={imageRef}
                {...labelled}
                className="absolute inset-0 will-change-transform"
                style={{ ...picture, transform: `scale(${zoom})` }}
              />
            </div>
          )}

          {hasContent && (
            <div
              ref={contentRef}
              data-slot="scroll-mask-content"
              className={cn(
                "absolute inset-0 flex items-center justify-center will-change-[transform,opacity]",
                revealContent && "opacity-0"
              )}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
