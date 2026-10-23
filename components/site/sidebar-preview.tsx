"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { useTheme } from "next-themes"

/** The card's size, for keeping it on screen. Its height is the 16:9 clip plus the caption. */
const WIDTH = 304
const HEIGHT = 226
const SHOW_DELAY = 260
const SWAP_DELAY = 70
const HIDE_DELAY = 90
const EASE = [0.22, 1, 0.36, 1] as const

export type PreviewTarget = { name: string; title: string; label: string }

const FINE_POINTER = "(hover: hover) and (pointer: fine)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** A mouse or trackpad, and no data saver: touch screens never hover, and the clips are not free. */
function useMediaAllowed() {
  return React.useSyncExternalStore(
    subscribe,
    () =>
      window.matchMedia(FINE_POINTER).matches &&
      !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    () => false,
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * The sidebar's hover preview, after React Bits: resting on an item for a moment opens a small card beside
 * the sidebar that plays the item's catalog clip, and the card trails the pointer on a spring.
 */
export function useSidebarPreview() {
  const allowed = useMediaAllowed()
  const reduceMotion = useReducedMotion() ?? false
  const [target, setTarget] = React.useState<PreviewTarget | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 420, damping: 38, mass: 0.72 })
  const springY = useSpring(y, { stiffness: 360, damping: 34, mass: 0.78 })
  const timers = React.useRef<{ show?: number; hide?: number }>({})

  const clearTimers = () => {
    window.clearTimeout(timers.current.show)
    window.clearTimeout(timers.current.hide)
  }

  /** Beside the sidebar, at the pointer's height, drifting a few pixels with the pointer's x. */
  const place = (event: React.PointerEvent<HTMLElement> | React.FocusEvent<HTMLElement>, jump: boolean) => {
    const item = event.currentTarget.getBoundingClientRect()
    const nav = event.currentTarget.closest("nav")?.getBoundingClientRect()
    const pointerX = "clientX" in event && event.clientX ? event.clientX : item.left + item.width / 2
    const pointerY = "clientY" in event && event.clientY ? event.clientY : item.top + item.height / 2
    const left = nav?.left ?? 16
    const width = nav?.width ?? 256
    const drift = (clamp((pointerX - left) / width, 0, 1) - 0.5) * 12
    const minY = nav?.top ?? 80
    const nextX = Math.min(window.innerWidth - WIDTH - 16, left + width + 16 + drift)
    const nextY = clamp(pointerY - HEIGHT / 2, minY, Math.max(minY, window.innerHeight - HEIGHT - 16))
    x.set(nextX)
    y.set(nextY)
    // The first card of a hover appears in place; only moves between items glide.
    if (jump) {
      springX.jump(nextX)
      springY.jump(nextY)
    }
  }

  const show = (next: PreviewTarget, event: React.PointerEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    if (!allowed) return
    clearTimers()
    place(event, target === null)
    timers.current.show = window.setTimeout(() => setTarget(next), target ? SWAP_DELAY : SHOW_DELAY)
  }

  const hide = (now = false) => {
    clearTimers()
    if (now) setTarget(null)
    else timers.current.hide = window.setTimeout(() => setTarget(null), HIDE_DELAY)
  }

  React.useEffect(() => {
    // The same object for the hook's whole life, so the cleanup sees the latest timers.
    const pending = timers.current
    return () => {
      window.clearTimeout(pending.show)
      window.clearTimeout(pending.hide)
    }
  }, [])

  /** Spread onto an item's link. */
  const handlers = (next: PreviewTarget) => ({
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => show(next, event),
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (allowed && !reduceMotion && target) place(event, false)
    },
    onPointerLeave: () => hide(),
    onFocus: (event: React.FocusEvent<HTMLElement>) => show(next, event),
    onBlur: () => hide(),
    onClick: () => hide(true),
  })

  return { allowed, reduceMotion, target, springX, springY, handlers }
}

const subscribeNothing = () => () => {}

export function SidebarPreview({ preview }: { preview: ReturnType<typeof useSidebarPreview> }) {
  const { allowed, reduceMotion, target, springX, springY } = preview
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const mounted = React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
  if (!mounted || !allowed) return null

  // On <body>: the sidebar's backdrop blur would otherwise become the containing block of this fixed card.
  return createPortal(
    <AnimatePresence>
      {target ? (
        <motion.aside
          key="sidebar-preview"
          aria-hidden
          style={{ x: springX, y: springY }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: EASE }}
          className="pointer-events-none fixed top-0 left-0 z-50 w-[304px] origin-left overflow-hidden rounded-[15px] border bg-card/95 p-[5px] shadow-[0_22px_58px_rgb(0_0_0/0.38)] backdrop-blur-xl max-lg:hidden"
        >
          <div className="relative aspect-video overflow-hidden rounded-[10px] bg-background">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={target.name}
                className="absolute inset-0"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(9px)", scale: 1.025 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(7px)", scale: 0.985 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.48, ease: EASE }}
              >
                {reduceMotion ? (
                  <Image
                    src={`/previews/${target.name}-${theme}.webp`}
                    alt=""
                    width={640}
                    height={360}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <video
                    key={`${target.name}-${theme}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={`/previews/${target.name}-${theme}.webp`}
                    className="size-full object-cover"
                  >
                    <source src={`/previews/${target.name}-${theme}.webm`} type="video/webm" />
                    <source src={`/previews/${target.name}-${theme}.mp4`} type="video/mp4" />
                  </video>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border border-border/60" />
          </div>
          <div className="flex min-h-[34px] items-center justify-between gap-3 px-2.5 pt-[11px] pb-[9px]">
            <span className="text-xs font-semibold tracking-[-0.01em]">{target.title}</span>
            <span className="truncate text-[11px] leading-none text-muted-foreground">{target.label}</span>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
