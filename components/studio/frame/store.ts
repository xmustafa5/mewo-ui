import { createStore } from "../store"
import type { Props, StudioComponent } from "../types"

export type FrameState = {
  id: string | null
  Component: StudioComponent | null
  props: Props
  /** Bumped to remount the background, which replays its intro. */
  key: number
}

export const frameStore = createStore<FrameState>({ id: null, Component: null, props: {}, key: 0 })

export const errorListeners = new Set<(error: Error) => void>()
