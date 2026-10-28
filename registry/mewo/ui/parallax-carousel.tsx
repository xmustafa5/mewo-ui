"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ParallaxCarouselControls {
  /** Glide until image `index` is centred, or as near as the scroll range allows without loop. */
  scrollToIndex: (index: number) => void
  /** Glide back to the start. */
  reset: () => void
}

export interface ParallaxCarouselProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Image URLs, in order. Landscape images give the parallax room to slide inside the portrait planes. */
  images?: string[]
  /** Plane width in pixels. */
  imageWidth?: number
  /** Plane height in pixels. */
  imageHeight?: number
  /** Gap between planes in pixels. */
  gap?: number
  /** How far each image slides inside its plane as the plane moves away from the centre, 0 to 1. */
  parallaxIntensity?: number
  /** The image is zoomed by 1 / uvScale inside its plane, for more parallax room. 0.6 to 1. */
  uvScale?: number
  /** Share of the remaining distance the strip covers per 60 fps frame, 0 to 1, at any frame rate. Lower glides longer. */
  lerp?: number
  /** Multiplier on wheel movement. Either wheel axis moves the strip sideways. */
  wheelSensitivity?: number
  /** Multiplier on drag movement. The strip glides to a stop on release, without a fling. */
  dragSensitivity?: number
  /**
   * Loop endlessly; the planes wrap around. Without it the scroll runs from the first image centred to content
   * width minus view width, so the last images stop short of the centre.
   */
  loop?: boolean
  /** Corner radius of the planes, in pixels. */
  borderRadius?: number
  /** Idle drift in pixels per second; 0 turns it off. It holds while dragging, off screen and with reduced motion. */
  autoplaySpeed?: number
  /** Hold the drift while a mouse is over the carousel. */
  pauseOnHover?: boolean
  /** Show a progress line at the bottom. It is hidden in loop mode and when there is nothing to scroll. */
  showProgress?: boolean
  /**
   * Tone curve applied to the images: each channel becomes (v / 255) ^ toneGamma. 2.2 gives a deep, saturated
   * look; 1 keeps the true colours. Needs readable pixels (same-origin, data: or CORS-enabled images); other
   * images show as they are.
   */
  toneGamma?: number
  /** Receives `{ scrollToIndex, reset }`. The root's own ref stays free for the consumer. */
  controlsRef?: React.Ref<ParallaxCarouselControls>
}

interface Texture {
  /** Which preparation this is: tone gamma and source. */
  key: string
  url: string
  /** Size of the image before padding, in source pixels. */
  w: number
  h: number
  /** Padding on each side, in source pixels. */
  pad: number
  /** The url is a blob made here, revoked when the last carousel showing it lets go. */
  blob: boolean
}

interface TextureEntry {
  /** Settles on the prepared image, or on null when it does not load at all. */
  ready: Promise<Texture | null>
  texture: Texture | null
  users: number
  released: boolean
}

const DEFAULT_IMAGES = Array.from({ length: 8 }, (_, index) => `https://picsum.photos/seed/mewo-parallax-carousel-${index + 1}/1200/800`)

// An image slides by this share of its drawn width, times the intensity, when its plane is half a view from the centre.
const PARALLAX_SCALE = 0.5
// A press has to travel this many pixels before it counts as a drag.
const DRAG_THRESHOLD = 3
// Images are downscaled to this width before they are prepared.
const TEXTURE_MAX_WIDTH = 1600
// A prepared image carries this share of its width again on either side, filled with its stretched edge columns,
// so a shift past the edge smears the edge pixels (like a clamped texture) instead of opening a gap.
const EDGE_PAD = 0.5
// A wheel reporting in lines (deltaMode 1) moves this many pixels per line.
const WHEEL_LINE = 40
// uvScale is held at or above this, so the zoom stays within reason.
const MIN_UV_SCALE = 0.3
// Below this many pixels from its target the strip has arrived.
const SETTLE_DISTANCE = 0.01

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const modulo = (value: number, count: number) => ((value % count) + count) % count

/** How far the strip scrolls without loop: content width minus view width. 0 has the first image centred. */
export function scrollRange(count: number, imageWidth: number, gap: number, viewWidth: number) {
  const content = count * imageWidth + Math.max(0, count - 1) * gap
  return Math.max(0, content - viewWidth)
}

/** How far an image slides inside its plane when the plane is `offset` pixels from the view's centre. It slides the same way as the plane. */
export function parallaxShift(offset: number, viewWidth: number, intensity: number, drawnWidth: number) {
  return PARALLAX_SCALE * intensity * (offset / (viewWidth / 2)) * drawnWidth
}

/** Share of the remaining distance covered in `dt` seconds: `lerp` per 60 fps frame, whatever the frame rate. */
export function easeFactor(lerp: number, dt: number) {
  return 1 - Math.pow(1 - clamp(lerp, 0.001, 1), dt * 60)
}

/** Lookup table for the tone curve: a channel value v becomes 255 × (v / 255) ^ gamma. */
export function toneCurve(gamma: number) {
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) lut[v] = 255 * Math.pow(v / 255, gamma)
  return lut
}

/** Scale that makes a prepared image cover a plane, zoomed by 1 / uvScale. */
const coverScale = (texture: Texture, width: number, height: number, uvScale: number) =>
  Math.max(width / texture.w, height / texture.h) / clamp(uvScale, MIN_UV_SCALE, 1)

// Prepared images, shared by every carousel that shows them and freed when the last one lets go.
const textureCache = new Map<string, TextureEntry>()
const textureKey = (src: string, gamma: number) => `${gamma}|${src}`

/**
 * Prepares an image once in a hidden 2D canvas: the tone curve, and padding left and right filled with the
 * stretched edge columns. Without readable pixels it settles on the plain image, so the image still shows.
 */
function prepareTexture(src: string, gamma: number, key: string): TextureEntry {
  const entry: TextureEntry = { ready: Promise.resolve(null), texture: null, users: 0, released: false }
  entry.ready = new Promise((resolve) => {
    const finish = (texture: Texture | null) => {
      if (entry.released) {
        if (texture?.blob) URL.revokeObjectURL(texture.url)
        resolve(null)
        return
      }
      entry.texture = texture
      resolve(texture)
    }

    const load = (cors: boolean) => {
      const image = new Image()
      if (cors) image.crossOrigin = "anonymous"
      image.decoding = "async"
      // An image served without CORS headers fails to load for reading; it loads again plainly, to show as it is.
      image.onerror = () => (cors ? load(false) : finish(null))
      image.onload = () => {
        if (entry.released) return finish(null)
        const scale = Math.min(1, TEXTURE_MAX_WIDTH / image.naturalWidth)
        const w = Math.max(1, Math.round(image.naturalWidth * scale))
        const h = Math.max(1, Math.round(image.naturalHeight * scale))
        const plain: Texture = { key, url: src, w, h, pad: 0, blob: false }
        if (!cors) return finish(plain)
        try {
          const pad = Math.round(w * EDGE_PAD)
          const canvas = document.createElement("canvas")
          canvas.width = w + pad * 2
          canvas.height = h
          const context = canvas.getContext("2d", { willReadFrequently: true })
          if (!context) return finish(plain)
          context.drawImage(image, pad, 0, w, h)
          // The first and last columns, stretched outwards.
          context.drawImage(canvas, pad, 0, 1, h, 0, 0, pad, h)
          context.drawImage(canvas, pad + w - 1, 0, 1, h, pad + w, 0, pad, h)
          if (gamma !== 1) {
            // Throws when the pixels turn out not to be readable.
            const data = context.getImageData(0, 0, canvas.width, h)
            const lut = toneCurve(gamma)
            const px = data.data
            for (let i = 0; i < px.length; i += 4) {
              px[i] = lut[px[i]]
              px[i + 1] = lut[px[i + 1]]
              px[i + 2] = lut[px[i + 2]]
            }
            context.putImageData(data, 0, 0)
          }
          canvas.toBlob((blob) => finish(blob ? { key, url: URL.createObjectURL(blob), w, h, pad, blob: true } : plain), "image/webp", 0.92)
        } catch {
          finish(plain)
        }
      }
      image.src = src
    }

    load(true)
  })
  return entry
}

function holdTexture(src: string, gamma: number) {
  const key = textureKey(src, gamma)
  let entry = textureCache.get(key)
  if (!entry) {
    entry = prepareTexture(src, gamma, key)
    textureCache.set(key, entry)
  }
  entry.users += 1
  return entry
}

function dropTexture(key: string) {
  const entry = textureCache.get(key)
  if (!entry) return
  entry.users -= 1
  if (entry.users > 0) return
  textureCache.delete(key)
  entry.released = true
  if (entry.texture?.blob) URL.revokeObjectURL(entry.texture.url)
  entry.texture = null
}

export function ParallaxCarousel({
  images = DEFAULT_IMAGES,
  imageWidth = 420,
  imageHeight = 560,
  gap = 32,
  parallaxIntensity = 0.4,
  uvScale = 1,
  lerp = 0.08,
  wheelSensitivity = 1,
  dragSensitivity = 1.4,
  loop = false,
  borderRadius = 16,
  autoplaySpeed = 0,
  pauseOnHover = true,
  showProgress = true,
  toneGamma = 2.2,
  controlsRef,
  className,
  ...props
}: ParallaxCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const planeRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const imageRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const fillRef = React.useRef<HTMLDivElement>(null)
  const syncRef = React.useRef<(() => void) | null>(null)
  const controlsImplRef = React.useRef<ParallaxCarouselControls | null>(null)
  // The preparations this carousel holds: the ones it wants and the ones it shows.
  const heldRef = React.useRef(new Set<string>())

  // The view's width is reported by a ResizeObserver; the frame loop keeps its own copy and never waits for it.
  const [viewWidth, setViewWidth] = React.useState(0)
  const [textures, setTextures] = React.useState<Record<string, Texture>>({})
  const [dragging, setDragging] = React.useState(false)

  const count = images.length
  const pitch = imageWidth + gap
  // Enough repeated slots that a wrapped strip always fills the view.
  const slots = loop && count ? count * Math.max(1, Math.ceil((viewWidth + pitch * 2) / (count * pitch))) : count
  const range = viewWidth > 0 ? scrollRange(count, imageWidth, gap, viewWidth) : 0

  const settings = {
    images,
    count,
    pitch,
    slots,
    imageWidth,
    imageHeight,
    gap,
    parallaxIntensity,
    uvScale,
    lerp,
    wheelSensitivity,
    dragSensitivity,
    loop,
    autoplaySpeed,
    pauseOnHover,
    textures,
  }
  const settingsRef = React.useRef(settings)

  // The frame loop and every listener are set up once. A prop change only reaches them through settingsRef.
  React.useLayoutEffect(() => {
    const track = trackRef.current
    // The root's ref stays the consumer's, so the root is reached through the track.
    const root = track?.parentElement
    if (!track || !root) return

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    let reduced = motionQuery?.matches ?? false
    const view = { w: root.clientWidth, h: root.clientHeight }
    // Scroll position in pixels, 0 with the first image centred. `current` eases toward `target`.
    let current = 0
    let target = 0
    let hovered = false
    let held = false
    let visible = true
    let raf = 0
    let last = 0
    const drag = { id: -1, x: 0, from: 0, moved: false }

    const clampScroll = (value: number) => {
      const s = settingsRef.current
      return s.loop ? value : clamp(value, 0, scrollRange(s.count, s.imageWidth, s.gap, view.w))
    }

    const layout = () => {
      const s = settingsRef.current
      if (!view.w || !s.count) return
      const top = (view.h - s.imageHeight) / 2
      const total = s.slots * s.pitch

      for (let i = 0; i < s.slots; i++) {
        const plane = planeRefs.current[i]
        if (!plane) continue
        // Plane centre relative to the view's centre; slot 0 sits in the centre at scroll 0.
        let offset = i * s.pitch - current
        if (s.loop) offset = modulo(offset + total / 2, total) - total / 2
        const shown = Math.abs(offset) < view.w / 2 + s.imageWidth
        // Planes past the edges are culled. The flag is written only when it flips, so a frame writes transforms alone.
        const visibility = shown ? "" : "hidden"
        if (plane.style.visibility !== visibility) plane.style.visibility = visibility
        if (!shown) continue
        plane.style.transform = `translate3d(${(view.w / 2 + offset - s.imageWidth / 2).toFixed(2)}px,${top.toFixed(2)}px,0)`

        // Parallax: the image layer slides the same way as its plane, further the further the plane is from the centre.
        const image = imageRefs.current[i]
        const texture = s.textures[s.images[i % s.count]]
        if (image && texture) {
          const drawn = texture.w * coverScale(texture, s.imageWidth, s.imageHeight, s.uvScale)
          image.style.transform = `translate3d(${parallaxShift(offset, view.w, s.parallaxIntensity, drawn).toFixed(2)}px,0,0)`
        }
      }

      const max = scrollRange(s.count, s.imageWidth, s.gap, view.w)
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${max ? clamp(current / max, 0, 1) : 0})`
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      const s = settingsRef.current
      // dt is clamped so a hitch or a tab switch does not jump the glide or the drift.
      const dt = clamp((now - last) / 1000, 1 / 240, 0.05)
      last = now
      let drifting = false
      if (s.autoplaySpeed !== 0 && !reduced && !held && !(s.pauseOnHover && hovered)) {
        const next = clampScroll(target + s.autoplaySpeed * dt)
        // A drift held at the end of the range is not movement.
        drifting = next !== target
        target = next
      }
      current += (target - current) * (reduced ? 1 : easeFactor(s.lerp, dt))
      if (Math.abs(target - current) < SETTLE_DISTANCE) current = target
      layout()
      // The loop ends once the strip has arrived and nothing drifts; a carousel at rest costs nothing.
      if (drifting || current !== target) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      // Never schedules off screen or in a hidden tab.
      if (raf || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    // After a render (a prop, the view's size, a texture or the drag state changed): clamp, lay out before paint, wake.
    const sync = () => {
      target = clampScroll(target)
      current = clampScroll(current)
      layout()
      wake()
    }

    const moveTo = (value: number) => {
      target = clampScroll(value)
      wake()
    }

    const scrollToIndex = (index: number) => {
      const s = settingsRef.current
      if (!s.count) return
      if (!s.loop) {
        moveTo(clamp(Math.round(index), 0, s.count - 1) * s.pitch)
        return
      }
      // In loop mode the strip takes the short way round.
      const total = s.count * s.pitch
      let delta = modulo(Math.round(index) * s.pitch - target, total)
      if (delta > total / 2) delta -= total
      moveTo(target + delta)
    }

    const reset = () => moveTo(0)

    // Either wheel axis scrolls; a vertical wheel moves the strip sideways.
    const onWheel = (event: WheelEvent) => {
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!raw) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? WHEEL_LINE : event.deltaMode === 2 ? view.w : 1
      moveTo(target + raw * unit * settingsRef.current.wheelSensitivity)
    }

    // Drag: the target follows the pointer and the ease provides the glide. There is no fling.
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      Object.assign(drag, { id: event.pointerId, x: event.clientX, from: target, moved: false })
      root.setPointerCapture?.(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (drag.id !== event.pointerId) return
      const dx = event.clientX - drag.x
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return
        drag.moved = true
        held = true
        setDragging(true)
      }
      moveTo(drag.from - dx * settingsRef.current.dragSensitivity)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (drag.id !== event.pointerId) return
      drag.id = -1
      if (!drag.moved) return
      held = false
      setDragging(false)
      wake()
    }

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovered = true
    }

    const onPointerLeave = () => {
      hovered = false
      wake()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const s = settingsRef.current
      const index = Math.round(target / s.pitch)
      if (event.key === "ArrowRight") scrollToIndex(index + 1)
      else if (event.key === "ArrowLeft") scrollToIndex(index - 1)
      else if (event.key === "Home") reset()
      else if (event.key === "End" && !s.loop) scrollToIndex(s.count - 1)
      else return
      event.preventDefault()
    }

    const onVisibility = () => wake()

    const onMotionChange = () => {
      reduced = motionQuery?.matches ?? false
      wake()
    }

    // An observer reports the root's size once on observing, then on every change.
    const resizeObserver = new ResizeObserver(() => {
      view.w = root.clientWidth
      view.h = root.clientHeight
      setViewWidth(view.w)
      sync()
    })
    // Off screen the loop stops where it is, autoplay included, and carries on when the carousel is back.
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) visible = entry.isIntersecting
      wake()
    })

    root.addEventListener("wheel", onWheel, { passive: false })
    root.addEventListener("pointerdown", onPointerDown, { passive: true })
    root.addEventListener("pointermove", onPointerMove, { passive: true })
    root.addEventListener("pointerup", onPointerUp, { passive: true })
    root.addEventListener("pointercancel", onPointerUp, { passive: true })
    root.addEventListener("pointerenter", onPointerEnter, { passive: true })
    root.addEventListener("pointerleave", onPointerLeave, { passive: true })
    root.addEventListener("keydown", onKeyDown)
    document.addEventListener("visibilitychange", onVisibility)
    motionQuery?.addEventListener?.("change", onMotionChange)
    resizeObserver.observe(root)
    intersectionObserver.observe(root)
    syncRef.current = sync
    controlsImplRef.current = { scrollToIndex, reset }

    return () => {
      cancelAnimationFrame(raf)
      syncRef.current = null
      controlsImplRef.current = null
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      root.removeEventListener("wheel", onWheel)
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("pointercancel", onPointerUp)
      root.removeEventListener("pointerenter", onPointerEnter)
      root.removeEventListener("pointerleave", onPointerLeave)
      root.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("visibilitychange", onVisibility)
      motionQuery?.removeEventListener?.("change", onMotionChange)
    }
  }, [])

  // Props reach the loop through this ref, written after every render and never during one. The loop then lays
  // the planes out before paint and runs for as long as something moves.
  React.useLayoutEffect(() => {
    settingsRef.current = settings
    syncRef.current?.()
  })

  React.useImperativeHandle(
    controlsRef,
    () => ({
      scrollToIndex: (index: number) => controlsImplRef.current?.scrollToIndex(index),
      reset: () => controlsImplRef.current?.reset(),
    }),
    []
  )

  // Each image is prepared once per tone gamma and shared with any other carousel showing it.
  React.useEffect(() => {
    const held = heldRef.current
    let alive = true
    for (const src of new Set(images)) {
      const key = textureKey(src, toneGamma)
      const entry = held.has(key) ? textureCache.get(key) : holdTexture(src, toneGamma)
      held.add(key)
      entry?.ready.then((texture) => {
        if (alive && texture) setTextures((t) => (t[src] === texture ? t : { ...t, [src]: texture }))
      })
    }
    return () => {
      alive = false
    }
  }, [images, toneGamma])

  // A preparation this carousel neither wants nor shows any more is let go, so a replaced tone gamma frees its blobs.
  React.useEffect(() => {
    const held = heldRef.current
    const keep = new Set(images.map((src) => textureKey(src, toneGamma)))
    for (const texture of Object.values(textures)) keep.add(texture.key)
    for (const key of held) {
      if (keep.has(key)) continue
      held.delete(key)
      dropTexture(key)
    }
  }, [images, toneGamma, textures])

  // On unmount every preparation is let go; the last carousel to let go of one revokes its blob URL.
  React.useEffect(() => {
    const held = heldRef.current
    return () => {
      for (const key of held) dropTexture(key)
      held.clear()
    }
  }, [])

  return (
    <div
      data-slot="parallax-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel. Drag, scroll or use the arrow keys to move through the images."
      tabIndex={0}
      className={cn(
        "relative h-full min-h-80 w-full cursor-grab touch-pan-y overflow-hidden text-foreground select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        dragging && "cursor-grabbing",
        className
      )}
      {...props}
    >
      <div ref={trackRef} className="absolute inset-0">
        {Array.from({ length: slots }, (_, i) => {
          const src = images[i % count]
          const texture = textures[src]
          let style: React.CSSProperties = { backgroundImage: `url(${JSON.stringify(src)})` }
          if (texture) {
            // Cover-fit the image; the padded texture reaches past both sides for the parallax.
            const cover = coverScale(texture, imageWidth, imageHeight, uvScale)
            const width = texture.w * cover
            const height = texture.h * cover
            const pad = texture.pad * cover
            style = {
              left: (imageWidth - width) / 2 - pad,
              top: (imageHeight - height) / 2,
              width: width + pad * 2,
              height,
              backgroundImage: `url(${JSON.stringify(texture.url)})`,
            }
          }
          return (
            <div
              key={i}
              ref={(el) => {
                planeRefs.current[i] = el
              }}
              data-slot="parallax-carousel-plane"
              role="img"
              aria-label={`Image ${(i % count) + 1} of ${count}`}
              aria-hidden={i >= count ? true : undefined}
              // The image moves inside the plane; isolation keeps the rounded clip cheap while it does.
              className="absolute top-0 left-0 isolate overflow-hidden bg-muted will-change-transform"
              style={{ width: imageWidth, height: imageHeight, borderRadius }}
            >
              <div
                ref={(el) => {
                  imageRefs.current[i] = el
                }}
                className={cn(
                  "pointer-events-none absolute bg-no-repeat will-change-transform",
                  texture ? "bg-size-[100%_100%]" : "inset-0 bg-cover bg-center"
                )}
                style={style}
              />
            </div>
          )
        })}
      </div>

      {showProgress && !loop && range > 0 && (
        <div
          data-slot="parallax-carousel-progress"
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-1/2 -ml-16 h-0.5 w-32 overflow-hidden rounded-full bg-current/15"
        >
          <div ref={fillRef} className="size-full origin-left bg-current/80 will-change-transform [transform:scaleX(0)]" />
        </div>
      )}
    </div>
  )
}
