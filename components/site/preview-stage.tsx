"use client"

import * as React from "react"
import type { Framing } from "@/lib/preview-framing"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    /** Set on preview pages: lets the capture script replay an entrance and find the demo's scroll box. */
    __mewoPreview?: { replay: () => void; scroller: () => HTMLElement | null }
  }
}

/** Frames one demo for its preview page. Remounting it (`replay`) plays an entrance animation again. */
export function PreviewStage({ framing, children }: { framing: Framing; children: React.ReactNode }) {
  const [run, setRun] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    window.__mewoPreview = {
      replay: () => setRun((count) => count + 1),
      scroller: () => {
        const root = rootRef.current
        if (!root) return null
        return (
          [...root.querySelectorAll<HTMLElement>("*")].find((element) => {
            const { overflowY } = getComputedStyle(element)
            return (overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight
          }) ?? null
        )
      },
    }
    return () => {
      delete window.__mewoPreview
    }
  }, [])

  if (framing.kind === "page") {
    // A section's docs page shows this page in its width-switching iframe, so it renders at full size here;
    // the capture script applies `data-capture-zoom` while filming.
    return (
      <div ref={rootRef} data-preview-stage data-capture-zoom={framing.zoom}>
        <React.Fragment key={run}>{children}</React.Fragment>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      data-preview-stage
      className={cn(
        "fixed inset-0 overflow-hidden bg-background",
        framing.kind === "center" && "grid place-items-center bg-dots",
      )}
    >
      {framing.kind === "fill" ? (
        // The demo's own box becomes the frame: its fixed height, height and width caps, corners and border give way, and
        // the helper copy a background demo lays over itself is left out of the thumbnail.
        <div
          key={run}
          className="size-full [&>*]:h-full! [&>*]:max-h-none! [&>*]:w-full! [&>*]:max-w-none! [&>*]:rounded-none! [&>*]:border-0! [&_[data-demo-overlay]]:hidden"
          style={framing.zoom ? { zoom: framing.zoom } : undefined}
        >
          {children}
        </div>
      ) : (
        <div key={run} className="flex w-full justify-center px-8" style={{ zoom: framing.zoom }}>
          {framing.fit ? <div className="w-max [&>*]:w-max!">{children}</div> : children}
        </div>
      )}
    </div>
  )
}
