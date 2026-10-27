"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ZoomPanel, type ZoomPanelProps, type ZoomPanelState } from "@/registry/mewo/ui/zoom-panel"

// The panel's windows, in screens of scroll, timed like the story's record: the thumbnail is there, opens a third of
// a screen later, closes back to the thumbnail, then leaves.
export const ZOOM_WINDOWS = { shown: [0, 2.1], open: [0.35, 1.7] } as const
export const ZOOM_RUNWAY = 2.5

/** The panel's state at a scroll position (screens). */
export function zoomStateAt(v: number): ZoomPanelState {
  if (v >= ZOOM_WINDOWS.open[0] && v < ZOOM_WINDOWS.open[1]) return "open"
  return v >= ZOOM_WINDOWS.shown[0] && v < ZOOM_WINDOWS.shown[1] ? "shown" : "hidden"
}

/**
 * A box that scrolls by itself, its scroll setting the panel's state the way a page's scroll does in a story. The
 * panel sits on a sticky stage that is a size container, so the open panel takes its height from the box.
 */
export function ZoomPanelScroll({
  className,
  onStateChange,
  ...props
}: Omit<ZoomPanelProps, "state" | "className"> & {
  className?: string
  /** Called on every scroll with the state and the position (screens). */
  onStateChange?: (state: ZoomPanelState, position: number) => void
}) {
  const [state, setState] = React.useState<ZoomPanelState>(zoomStateAt(0))
  return (
    <div
      className={cn("h-full overflow-y-auto", className)}
      onScroll={(e) => {
        const box = e.currentTarget
        const position = box.scrollTop / Math.max(1, box.clientHeight)
        const next = zoomStateAt(position)
        setState(next)
        onStateChange?.(next, position)
      }}
    >
      <div style={{ height: `${(ZOOM_RUNWAY + 1) * 100}%` }}>
        <div className="sticky top-0 [container-type:size]" style={{ height: `${100 / (ZOOM_RUNWAY + 1)}%` }}>
          <ZoomPanel state={state} {...props} />
        </div>
      </div>
    </div>
  )
}
