"use client"

import * as React from "react"
import { Venom } from "@/registry/mewo/ui/venom"

function Spider() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="32" cy="23" rx="6.5" ry="7.5" fill="currentColor" />
      <ellipse cx="32" cy="40" rx="8.5" ry="12" fill="currentColor" />
      <path d="M27 21 17 11 11 3M26 27 13 22 4 26M26 34 13 37 6 45M27 39 18 47 14 59" />
      <path d="M37 21 47 11 53 3M38 27 51 22 60 26M38 34 51 37 58 45M37 39 46 47 50 59" />
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
          <Spider />
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
