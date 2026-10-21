"use client"

import { Component as ReactComponent, useEffect, useSyncExternalStore, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { findEntry } from "../catalog"
import type { Props } from "../types"
import { FRAME_READY_MESSAGE, type StudioBridge } from "./bridge"
import { clock } from "./clock"
import { errorListeners, frameStore } from "./store"

/**
 * The page inside the preview iframe. It owns nothing but the background: the studio drives it through
 * `window.__mewoStudio`, and the background's errors stop at the boundary below instead of taking the
 * editor down with them.
 */

const INPUT_EVENTS = [
  "pointermove",
  "pointerdown",
  "pointerup",
  "mousemove",
  "mousedown",
  "mouseup",
  "touchstart",
  "touchmove",
  "click",
  "wheel",
] as const

let loadToken = 0

/** A paused background still has to show a prop change: run one frame now and a few more as textures settle. */
const refreshSoon = () => {
  if (!clock.paused) return
  clock.refresh()
  for (const delay of [60, 180, 400]) window.setTimeout(() => clock.refresh(), delay)
}

const setTheme = (theme: string | null) => {
  const dark = theme !== "light"
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}

const load = async (id: string, props: Props = {}) => {
  loadToken += 1
  const token = loadToken
  const entry = findEntry(id)
  if (!entry) throw new Error(`Unknown background: ${id}`)
  const Component = await entry.load()
  if (token !== loadToken) return false
  flushSync(() => frameStore.set((previous) => ({ id, Component, props, key: previous.key + 1 })))
  refreshSoon()
  return true
}

const update = (props: Props) => {
  flushSync(() => frameStore.set({ props }))
  refreshSoon()
}

const restart = () => {
  flushSync(() => frameStore.set((previous) => ({ key: previous.key + 1 })))
  refreshSoon()
}

const bridge: StudioBridge = {
  clock,
  load,
  update,
  restart,
  setTheme,
  stage: () => document.querySelector<HTMLElement>("[data-frame-stage]"),
  onError(listener) {
    errorListeners.add(listener)
    return () => errorListeners.delete(listener)
  },
}

class Boundary extends ReactComponent<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    errorListeners.forEach((listener) => listener(error))
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Frame() {
  const { Component, props, key } = useSyncExternalStore(frameStore.subscribe, frameStore.get, frameStore.get)
  return (
    <div data-frame-stage className="fixed inset-0">
      {Component ? (
        <Boundary key={key}>
          <Component {...props} />
        </Boundary>
      ) : null}
    </div>
  )
}

export default function StudioFrame() {
  useEffect(() => {
    setTheme(new URLSearchParams(window.location.search).get("theme"))
    window.__mewoStudio = bridge
    // While paused, nothing reaches the background: a cursor ripple would otherwise queue up and burst on resume.
    const swallow = (event: Event) => {
      if (clock.paused) event.stopImmediatePropagation()
    }
    for (const type of INPUT_EVENTS) window.addEventListener(type, swallow, { capture: true, passive: true })
    window.parent?.postMessage({ type: FRAME_READY_MESSAGE }, window.location.origin)
    return () => {
      for (const type of INPUT_EVENTS) window.removeEventListener(type, swallow, { capture: true })
      delete window.__mewoStudio
    }
  }, [])

  return <Frame />
}
