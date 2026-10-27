"use client"

import * as React from "react"
import { PictureWave, type PictureWaveState } from "@/registry/mewo/ui/picture-wave"

/** The wave flies in and bursts into the field; a while later it gathers back into the wave and bursts again. Its
 * state lives here so the demo module stays server-safe. */
export function PictureWaveCycle() {
  const [state, setState] = React.useState<PictureWaveState>("field")
  React.useEffect(() => {
    const id = setTimeout(() => setState((s) => (s === "field" ? "wave" : "field")), state === "field" ? 9000 : 3000)
    return () => clearTimeout(id)
  }, [state])
  return <PictureWave state={state} orientation="horizontal" />
}
