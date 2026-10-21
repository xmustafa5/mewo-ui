import type { Clock } from "./bridge"

/**
 * The frame's clock. It replaces `requestAnimationFrame`, `performance.now` and `Date.now` on the frame's own
 * window, which is what lets the studio pause every background exactly, nudge one frame after a prop change,
 * and step time by hand while exporting. Only safe here because the frame is a dedicated document: never
 * install this on a page that has other work to do.
 */
type Timer = { handler: (...args: unknown[]) => void; args: unknown[]; due: number; every: number }

const serverClock: Clock = {
  manual: false,
  now: () => 0,
  paused: false,
  subscribe: () => () => {},
  pause: () => {},
  resume: () => {},
  refresh: () => {},
  step: () => {},
  afterFrame: () => {},
  wait: () => Promise.resolve(),
}

function createClock(): Clock {
  const query = new URLSearchParams(window.location.search)
  const manual = query.get("clock") === "manual"
  const seed = Number(query.get("seed"))
  const pixelRatio = Number(query.get("dpr"))

  const nativeRaf = window.requestAnimationFrame.bind(window)
  const nativeCaf = window.cancelAnimationFrame.bind(window)
  const nativeNow = performance.now.bind(performance)
  const nativeDateNow = Date.now.bind(Date)
  const nativeSetTimeout = window.setTimeout.bind(window)
  const nativeClearTimeout = window.clearTimeout.bind(window)
  const nativeSetInterval = window.setInterval.bind(window)
  const nativeClearInterval = window.clearInterval.bind(window)

  const dateOffset = nativeDateNow() - nativeNow()

  let paused = false
  let offset = 0
  let frozenAt = 0
  let virtual = nativeNow()
  let pending = 0
  let frameId = 0
  let callbacks = new Map<number, FrameRequestCallback>()
  const afterFrame = new Set<(timestamp: number) => void>()
  const listeners = new Set<() => void>()
  const timers = new Map<number, Timer>()
  let timerId = 1 << 24
  const managed = new WeakSet<Animation>()

  const now = () => {
    if (manual) return virtual
    return paused ? frozenAt : nativeNow() - offset
  }

  const report = (error: unknown) => {
    if (typeof window.reportError === "function") window.reportError(error)
    else
      nativeSetTimeout(() => {
        throw error
      })
  }

  const run = (timestamp: number) => {
    const batch = callbacks
    callbacks = new Map()
    batch.forEach((callback) => {
      try {
        callback(timestamp)
      } catch (error) {
        report(error)
      }
    })
    const hooks = [...afterFrame]
    afterFrame.clear()
    hooks.forEach((hook) => hook(timestamp))
  }

  const pump = () => {
    pending = 0
    if (manual || paused) return
    run(now())
  }

  const schedule = () => {
    if (!pending && !manual && !paused) pending = nativeRaf(pump)
  }

  const animations = () => (typeof document.getAnimations === "function" ? document.getAnimations() : [])

  // CSS animations run on the compositor, outside the patched rAF, so they are driven by hand in manual mode.
  const syncAnimations = (elapsed: number) => {
    animations().forEach((animation) => {
      if (!managed.has(animation)) {
        managed.add(animation)
        animation.pause()
      }
      animation.currentTime = (Number(animation.currentTime) || 0) + elapsed
    })
  }

  const emit = () => listeners.forEach((listener) => listener())

  window.requestAnimationFrame = (callback) => {
    frameId += 1
    callbacks.set(frameId, callback)
    schedule()
    return frameId
  }

  window.cancelAnimationFrame = (id) => {
    callbacks.delete(id)
  }

  performance.now = now
  Date.now = () => Math.round(dateOffset + now())

  if (manual) {
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== "function" || !(Number(delay) > 0)) return nativeSetTimeout(handler, delay, ...args)
      timerId += 1
      timers.set(timerId, { handler: handler as Timer["handler"], args, due: virtual + Number(delay), every: 0 })
      return timerId
    }) as typeof window.setTimeout
    window.setInterval = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== "function") return nativeSetInterval(handler, delay, ...args)
      const every = Math.max(Number(delay) || 0, 1)
      timerId += 1
      timers.set(timerId, { handler: handler as Timer["handler"], args, due: virtual + every, every })
      return timerId
    }) as typeof window.setInterval
    window.clearTimeout = (id) => {
      if (typeof id === "number" && timers.has(id)) timers.delete(id)
      else nativeClearTimeout(id)
    }
    window.clearInterval = (id) => {
      if (typeof id === "number" && timers.has(id)) timers.delete(id)
      else nativeClearInterval(id)
    }
  }

  if (Number.isFinite(seed) && query.has("seed")) {
    let state = seed >>> 0 || 1
    Math.random = () => {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  if (pixelRatio > 0) {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, get: () => pixelRatio })
  }

  const nextTimer = (limit: number) => {
    let found: { id: number; timer: Timer } | null = null
    for (const [id, timer] of timers) {
      if (timer.due <= limit && (!found || timer.due < found.timer.due)) found = { id, timer }
    }
    return found
  }

  const fireTimers = (limit: number) => {
    for (let guard = 0; guard < 1000; guard++) {
      const next = nextTimer(limit)
      if (!next) return
      const { id, timer } = next
      virtual = Math.max(virtual, timer.due)
      if (timer.every) timer.due += timer.every
      else timers.delete(id)
      try {
        timer.handler(...timer.args)
      } catch (error) {
        report(error)
      }
    }
  }

  return {
    manual,
    now,
    get paused() {
      return paused
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    pause() {
      if (manual || paused) return
      frozenAt = now()
      paused = true
      if (pending) nativeCaf(pending)
      pending = 0
      animations().forEach((animation) => animation.pause())
      emit()
    },
    resume() {
      if (manual || !paused) return
      offset = nativeNow() - frozenAt
      paused = false
      animations().forEach((animation) => {
        if (animation.playState === "paused") animation.play()
      })
      schedule()
      emit()
    },
    refresh() {
      if (manual || !paused) return
      frozenAt += 1
      run(frozenAt)
    },
    step(ms) {
      if (!manual) return
      const target = virtual + ms
      fireTimers(target)
      virtual = target
      syncAnimations(ms)
      run(virtual)
    },
    afterFrame(hook) {
      afterFrame.add(hook)
      schedule()
    },
    wait(ms) {
      return new Promise((resolve) => nativeSetTimeout(resolve, ms))
    },
  }
}

export const clock: Clock = typeof window === "undefined" ? serverClock : createClock()
