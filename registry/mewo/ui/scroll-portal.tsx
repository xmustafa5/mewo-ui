"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ScrollPortalScene {
  /** Any CSS background: colour, gradient or image. Defaults to the theme background. */
  background?: string
  content?: React.ReactNode
  /** Overrides `frameRadius` for this scene's frame. */
  radius?: number
  /** Overrides `accent` for this scene's frame border. */
  accent?: string
}

export interface ScrollPortalProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** Ordered scenes; each may set background, content, radius and accent. */
  scenes?: ScrollPortalScene[]
  /** Distance between frames. Larger values nest the next frame smaller. */
  frameDepth?: number
  /** Focal length of the camera in pixels. Smaller values exaggerate depth. */
  perspective?: number
  /** Scroll runway per scene handoff, in viewport heights. */
  scrollLength?: number
  /** Corner radius of nested frames in pixels. */
  frameRadius?: number
  /** Border width of nested frames in pixels. */
  frameBorder?: number
  /** Catch-up time in seconds. 0 locks the camera to the scroll position. */
  scrub?: number
  /** Fraction of each handoff the camera rests before travelling. */
  hold?: number
  /** How much nested frames fade with distance, 0 to 1. */
  dim?: number
  /** Colour nested frames fade toward with distance. */
  dimColor?: string
  /** Fallback border colour when a scene sets no accent. */
  accent?: string
  /** Stage width below which depth and perspective are reduced. */
  mobileBreakpoint?: number
  /** Called when the scene nearest the camera changes. */
  onSceneChange?: (index: number) => void
}

// Camera travel in pixels for one unit of `frameDepth`.
const DEPTH_UNIT = 1000
// A scene the camera is leaving keeps growing; cap it so the maths stays finite.
const MAX_SCALE = 40
// Radius and border ease out over this much scale as a frame fills the stage.
const EDGE_FADE = 0.12
const MOBILE_DEPTH = 0.6
const MOBILE_PERSPECTIVE = 0.8

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Size of frame `index` on screen while the camera sits at `camera`; 1 fills the stage. */
export function portalFrameScale(index: number, camera: number, focal: number, depth: number): number {
  const distance = focal + (index - camera) * depth
  return distance > focal / MAX_SCALE ? focal / distance : MAX_SCALE
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
}

export function ScrollPortal({
  scenes = [],
  frameDepth = 1,
  perspective = 1000,
  scrollLength = 1,
  frameRadius = 16,
  frameBorder = 1,
  scrub = 0.35,
  hold = 0,
  dim = 0.55,
  dimColor = "#000000",
  accent = "color-mix(in oklch, var(--color-foreground) 18%, transparent)",
  mobileBreakpoint = 768,
  onSceneChange,
  className,
  style,
  ...props
}: ScrollPortalProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const frameRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const contentRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const dimRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const borderRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const progressRef = React.useRef<number | null>(null)
  const activeRef = React.useRef(-1)
  const onSceneChangeRef = React.useRef(onSceneChange)

  React.useEffect(() => {
    onSceneChangeRef.current = onSceneChange
  }, [onSceneChange])

  const count = scenes.length

  React.useEffect(() => {
    const stage = stageRef.current
    // The root's ref stays the consumer's, so the section is reached through the stage.
    const section = stage?.parentElement
    if (!stage || !section || count === 0) return

    const scroller = scrollParent(section)
    // Inside a scroll container the stage pins to that container, not the window.
    const fit = () => {
      if (scroller) section.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
    }
    fit()
    // Reduced motion gets the CSS fallback: scenes stacked as plain sections, nothing pinned.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const catchUp = Math.max(0, scrub)
    const rest = clamp(hold, 0, 0.95)
    const fade = clamp(dim, 0, 1)

    let target = 0
    let raf = 0
    let last = 0

    const measure = () => {
      const origin = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0
      const scrolled = origin - section.getBoundingClientRect().top
      const runway = section.offsetHeight - stage.offsetHeight
      target = runway > 0 ? clamp(scrolled / runway, 0, 1) * (count - 1) : 0
    }

    const render = (progress: number) => {
      const mobile = stage.clientWidth < mobileBreakpoint
      const focal = Math.max(1, perspective * (mobile ? MOBILE_PERSPECTIVE : 1))
      const depth = Math.max(0, frameDepth) * DEPTH_UNIT * (mobile ? MOBILE_DEPTH : 1)

      // Each handoff rests for `hold` of its runway, then travels the rest.
      const base = Math.min(Math.floor(progress), Math.max(0, count - 2))
      const camera = base + clamp((progress - base - rest) / (1 - rest), 0, 1)
      const active = clamp(Math.round(camera), 0, count - 1)

      for (let i = 0; i < count; i++) {
        const frame = frameRefs.current[i]
        if (!frame) continue

        // Once the next frame fills the stage this one can no longer be seen.
        if (camera >= i + 1) {
          frame.style.visibility = "hidden"
          continue
        }

        const scale = portalFrameScale(i, camera, focal, depth)
        // The composited frame never grows past the stage, so its layer is always
        // rastered at 1x; past that only the content zooms toward the camera.
        const outer = Math.min(scale, 1)
        const edge = clamp((1 - outer) / EDGE_FADE, 0, 1)
        const radius = scenes[i].radius ?? frameRadius

        frame.style.visibility = "visible"
        frame.style.transform = `translate3d(0,0,0) scale(${outer})`
        frame.style.borderRadius = `${(radius * edge) / outer}px`
        frame.style.pointerEvents = i === active ? "auto" : "none"

        const content = contentRefs.current[i]
        if (content) content.style.transform = scale > 1 ? `scale(${scale})` : ""

        const shade = dimRefs.current[i]
        if (shade) shade.style.opacity = `${fade * (1 - Math.exp(-1.2 * Math.max(0, i - camera)))}`

        const border = borderRefs.current[i]
        if (border) {
          border.style.borderWidth = `${frameBorder / outer}px`
          border.style.opacity = `${edge}`
        }
      }

      if (active !== activeRef.current) {
        activeRef.current = active
        onSceneChangeRef.current?.(active)
      }
    }

    const tick = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1)
      last = now

      let progress = progressRef.current ?? target
      // Exponential catch-up that covers ~95% of the gap in `scrub` seconds.
      progress = catchUp > 0 ? progress + (target - progress) * (1 - Math.exp((-3 * dt) / catchUp)) : target
      if (Math.abs(target - progress) < 0.0004) progress = target

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
      fit()
      update()
      render(progressRef.current ?? target)
    }

    measure()
    // Snap on mount; afterwards keep the eased position across prop changes.
    progressRef.current = clamp(progressRef.current ?? target, 0, count - 1)
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
  }, [scenes, count, frameDepth, perspective, scrollLength, frameRadius, frameBorder, scrub, hold, dim, mobileBreakpoint])

  const restingDepth = Math.max(0, frameDepth) * DEPTH_UNIT

  return (
    <section
      data-slot="scroll-portal"
      className={cn(
        "relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))] motion-reduce:h-auto",
        className
      )}
      style={{ "--mewo-length": 1 + Math.max(0, count - 1) * Math.max(0, scrollLength), ...style } as React.CSSProperties}
      {...props}
    >
      <div
        ref={stageRef}
        data-slot="scroll-portal-stage"
        className="sticky top-0 h-[var(--mewo-viewport,100vh)] overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible"
      >
        {scenes.map((scene, i) => (
          <div
            key={i}
            ref={(el) => {
              frameRefs.current[i] = el
            }}
            data-slot="scroll-portal-frame"
            className="absolute inset-0 overflow-hidden bg-background will-change-transform motion-reduce:relative motion-reduce:inset-auto motion-reduce:h-[var(--mewo-viewport,100vh)] motion-reduce:transform-none!"
            style={{
              background: scene.background,
              // Resting pose for the first paint; the effect drives it once mounted.
              transform: `translate3d(0,0,0) scale(${Math.min(1, portalFrameScale(i, 0, Math.max(1, perspective), restingDepth))})`,
            }}
          >
            <div
              ref={(el) => {
                contentRefs.current[i] = el
              }}
              className="absolute inset-0"
            >
              {scene.content}
            </div>
            <div
              ref={(el) => {
                dimRefs.current[i] = el
              }}
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{ background: dimColor }}
            />
            <div
              ref={(el) => {
                borderRefs.current[i] = el
              }}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
              style={{ border: `${frameBorder}px solid ${scene.accent ?? accent}` }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
