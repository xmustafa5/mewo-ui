"use client"

import * as React from "react"

const REDUCED = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
const useReducedMotion = () =>
  React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )

export type SpringState = { value: number; velocity: number; /** Seconds the spring has been moving, for anything that ripples with it. */ time: number }

/**
 * `target`, followed with a spring: it overshoots and settles. A frame loop runs only while something moves, so a
 * control at rest costs nothing; a visitor who asked for reduced motion gets the target at once.
 */
export function useSpring(target: number, { stiffness = 220, damping = 18 }: { stiffness?: number; damping?: number } = {}): SpringState {
  const reduced = useReducedMotion()
  const [state, setState] = React.useState<SpringState>({ value: target, velocity: 0, time: 0 })
  const sim = React.useRef({ value: target, velocity: 0, time: 0, target, frame: 0, last: 0 })

  React.useEffect(() => {
    if (reduced || typeof requestAnimationFrame !== "function") return
    const s = sim.current
    s.target = target
    // a loop already running picks the new target up on its next frame; at rest on the target there is nothing to do
    if (s.frame || (s.value === target && s.velocity === 0)) return
    const tick = (now: number) => {
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60
      s.last = now
      const force = -stiffness * (s.value - s.target) - damping * s.velocity
      s.velocity += force * dt
      s.value += s.velocity * dt
      s.time += dt
      if (Math.abs(s.value - s.target) < 0.02 && Math.abs(s.velocity) < 0.3) {
        s.value = s.target
        s.velocity = 0
        s.frame = 0
        s.last = 0
        setState({ value: s.value, velocity: 0, time: s.time })
        return
      }
      setState({ value: s.value, velocity: s.velocity, time: s.time })
      s.frame = requestAnimationFrame(tick)
    }
    s.frame = requestAnimationFrame(tick)
  }, [target, stiffness, damping, reduced])

  // on unmount the loop stops; the frame id is cleared too, so a remount (React's development double mount
  // included) can start it again rather than believing a loop is still running
  React.useEffect(() => {
    const s = sim.current
    return () => {
      if (s.frame) cancelAnimationFrame(s.frame)
      s.frame = 0
      s.last = 0
    }
  }, [])

  // with reduced motion, or before the loop has moved, the spring sits on its target
  return reduced ? { value: target, velocity: 0, time: 0 } : state
}

/** The element's width, kept up to date by a ResizeObserver, which also reports the first size. 0 until then. */
export function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState(0)
  React.useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}
