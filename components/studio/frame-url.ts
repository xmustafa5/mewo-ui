import type { StudioBridge } from "./frame/bridge"

export const FRAME_PATH = "/studio/frame"

export const frameUrl = (params: Record<string, string | number>) =>
  `${FRAME_PATH}?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`

export const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Yields to the browser between render batches without being throttled like `setTimeout` is. */
export const nextTask = () =>
  new Promise<void>((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    channel.port2.postMessage(0)
  })

/** Resolves with the bridge once the frame page has installed it on its window. */
export function waitForBridge(iframe: HTMLIFrameElement, timeout = 20000): Promise<StudioBridge> {
  return new Promise((resolve, reject) => {
    const started = performance.now()
    let timer = 0
    const cleanup = () => {
      window.clearInterval(timer)
      window.removeEventListener("message", onMessage)
      iframe.removeEventListener("load", check)
    }
    function check() {
      const api = iframe.contentWindow?.__mewoStudio
      if (api) {
        cleanup()
        resolve(api)
      } else if (performance.now() - started > timeout) {
        cleanup()
        reject(new Error("The preview frame did not start."))
      }
    }
    function onMessage(event: MessageEvent) {
      if (event.source === iframe.contentWindow) check()
    }
    timer = window.setInterval(check, 50)
    window.addEventListener("message", onMessage)
    iframe.addEventListener("load", check)
  })
}
