import type { Props } from "../types"

/** The frame's clock. Every background inside the frame runs on it, which is what makes pause and export exact. */
export type Clock = {
  /** True when the frame was opened with `clock=manual`: time only moves when `step()` is called. */
  manual: boolean
  now: () => number
  readonly paused: boolean
  subscribe: (listener: () => void) => () => void
  pause: () => void
  resume: () => void
  /** While paused, runs one more frame so a prop change still shows up. */
  refresh: () => void
  /** Manual mode only: advances virtual time by `ms` and runs everything due. */
  step: (ms: number) => void
  /** Runs `hook` once, after the next frame has painted. */
  afterFrame: (hook: (timestamp: number) => void) => void
  wait: (ms: number) => Promise<void>
}

/** What the frame page installs on its `window` for the studio to drive it. */
export type StudioBridge = {
  clock: Clock
  load: (id: string, props?: Props) => Promise<boolean>
  update: (props: Props) => void
  restart: () => void
  setTheme: (theme: string | null) => void
  stage: () => HTMLElement | null
  onError: (listener: (error: Error) => void) => () => void
}

export const BRIDGE_KEY = "__mewoStudio"
export const FRAME_READY_MESSAGE = "mewo-studio-frame"

declare global {
  interface Window {
    __mewoStudio?: StudioBridge
  }
}
