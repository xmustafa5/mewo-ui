"use client"

import * as React from "react"
import { BODY_PATH, EYE_PATHS, MARK_VIEWBOX, PIXEL_PATHS } from "@/components/site/mewo-mark"
import { Venom } from "@/registry/mewo/ui/venom"

/**
 * The mewo cat as a silhouette. Venom only reads an icon's shape, so the eyes are cut out of the body
 * (even-odd fill) rather than painted white: the symbiote then grows around them and they stay empty.
 */
function MewoSilhouette() {
  return (
    <svg viewBox={`${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}>
      <path fillRule="evenodd" d={[BODY_PATH, ...EYE_PATHS].join(" ")} />
      {PIXEL_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** The Venom demo's body: one symbiote that switches between covering a word and covering an icon. */
export function VenomSwitch() {
  const [mode, setMode] = React.useState<"text" | "icon">("text")
  return (
    <>
      {mode === "text" ? (
        <Venom className="absolute inset-0" text="VENOM" />
      ) : (
        <Venom className="absolute inset-0" scale={0.78}>
          <MewoSilhouette />
        </Venom>
      )}
      <div
        data-demo-overlay
        className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-background/80 p-1 text-sm backdrop-blur"
      >
        {(["text", "icon"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className="rounded-full px-3 py-1 capitalize text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {value}
          </button>
        ))}
      </div>
    </>
  )
}
