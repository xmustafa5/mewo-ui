import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { collectLayers, drawLayers } from "../compose"
import { frameUrl } from "../frame-url"
import { FRAME_READY_MESSAGE, type StudioBridge } from "../frame/bridge"
import { createStore } from "../store"
import type { Props, StudioEntry } from "../types"

export type FrameStatus = "booting" | "loading" | "ready" | "error"

type FrameState = { bridge: StudioBridge | null; status: FrameStatus; error: Error | null; paused: boolean }

type Options = {
  entry: StudioEntry
  renderProps: Props
  light: boolean
  onKeyDown?: (event: KeyboardEvent) => void
}

/**
 * Owns the preview iframe: connects to the bridge the frame page installs, loads the chosen background into
 * it, pushes prop changes across, and exposes pause, replay and snapshot.
 */
export function useStageFrame({ entry, renderProps, light, onKeyDown }: Options) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [store] = useState(() =>
    createStore<FrameState>({ bridge: null, status: "booting", error: null, paused: false }),
  )
  const state = useSyncExternalStore(store.subscribe, store.get, store.get)
  const [src] = useState(() => frameUrl({ theme: light ? "light" : "dark" }))
  const loaded = useRef<string | null>(null)
  const token = useRef(0)
  const propsRef = useRef(renderProps)
  const keyRef = useRef(onKeyDown)

  useEffect(() => {
    propsRef.current = renderProps
    keyRef.current = onKeyDown
  })

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    let api: StudioBridge | null = null
    let detach: (() => void)[] = []

    const connect = () => {
      const view = iframe.contentWindow
      const next = view?.__mewoStudio
      if (!view || !next || next === api) return
      detach.forEach((dispose) => dispose())
      api = next
      const handleKey = (event: KeyboardEvent) => keyRef.current?.(event)
      view.addEventListener("keydown", handleKey)
      detach = [
        next.clock.subscribe(() => store.set({ paused: next.clock.paused })),
        next.onError((problem) => store.set({ error: problem, status: "error" })),
        () => view.removeEventListener("keydown", handleKey),
      ]
      loaded.current = null
      store.set({ bridge: next, paused: next.clock.paused })
    }

    const onMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow && event.data?.type === FRAME_READY_MESSAGE) connect()
    }

    window.addEventListener("message", onMessage)
    iframe.addEventListener("load", connect)
    const timer = window.setTimeout(connect, 0)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("message", onMessage)
      iframe.removeEventListener("load", connect)
      detach.forEach((dispose) => dispose())
    }
  }, [store])

  const { bridge } = state

  useEffect(() => {
    bridge?.setTheme(light ? "light" : "dark")
  }, [bridge, light])

  useEffect(() => {
    if (!bridge) return

    if (loaded.current === entry.id) {
      bridge.update(renderProps)
      if (entry.forceRemountOnPropChange) bridge.restart()
      return
    }

    loaded.current = entry.id
    token.current += 1
    const current = token.current
    store.set({ status: "loading", error: null })
    if (bridge.clock.paused) bridge.clock.resume()

    bridge
      .load(entry.id, renderProps)
      .then((ok) => {
        if (!ok || current !== token.current) return
        bridge.update(propsRef.current)
        // Two frames: one for the background to mount, one for it to paint, before the spinner lifts.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (current === token.current)
              store.set((previous) => ({ status: previous.status === "loading" ? "ready" : previous.status }))
          }),
        )
      })
      .catch((problem: Error) => {
        if (current !== token.current) return
        store.set({ error: problem, status: "error" })
      })
  }, [bridge, entry, renderProps, store])

  const togglePause = useCallback(() => {
    if (!bridge) return
    if (bridge.clock.paused) bridge.clock.resume()
    else bridge.clock.pause()
  }, [bridge])

  const restart = useCallback(() => {
    if (!bridge) return
    if (bridge.clock.paused) bridge.clock.resume()
    store.set((previous) => ({ error: null, status: previous.status === "error" ? "ready" : previous.status }))
    bridge.restart()
  }, [bridge, store])

  /** Draws the frame's canvases into a new canvas at the device pixel ratio, after the next painted frame. */
  const snapshot = useCallback(
    (fill: string | null) =>
      new Promise<HTMLCanvasElement>((resolve, reject) => {
        if (!bridge) {
          reject(new Error("The preview is not ready yet."))
          return
        }
        const capture = () => {
          try {
            const stage = bridge.stage()
            if (!stage) throw new Error("The preview has no stage.")
            const scene = collectLayers(stage)
            const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3)
            const canvas = document.createElement("canvas")
            canvas.width = Math.max(1, Math.round(scene.width * ratio))
            canvas.height = Math.max(1, Math.round(scene.height * ratio))
            const context = canvas.getContext("2d")
            if (!context) throw new Error("Could not draw the snapshot.")
            drawLayers(context, scene, canvas.width, canvas.height, fill)
            resolve(canvas)
          } catch (problem) {
            reject(problem)
          }
        }
        bridge.clock.afterFrame(capture)
        if (bridge.clock.paused) bridge.clock.refresh()
      }),
    [bridge],
  )

  return {
    iframeRef,
    src,
    bridge,
    status: state.status,
    error: state.error,
    paused: state.paused,
    togglePause,
    restart,
    snapshot,
  }
}
