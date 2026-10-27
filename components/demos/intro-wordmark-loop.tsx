"use client"

import * as React from "react"
import { IntroWordmark, type IntroWordmarkStage } from "@/registry/mewo/ui/intro-wordmark"

// the page's intro, on a loop: hidden, mid-screen, moved up, then scrolled away (hidden on wide screens)
const STEPS: { stage: IntroWordmarkStage; atTop: boolean; ms: number }[] = [
  { stage: "hidden", atTop: true, ms: 800 },
  { stage: "center", atTop: true, ms: 1400 },
  { stage: "top", atTop: true, ms: 2000 },
  { stage: "top", atTop: false, ms: 1200 },
]

/** The wordmark through the intro, on a loop. Its state lives here so the demo module stays server-safe. */
export function IntroWordmarkLoop() {
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    const timer = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEPS[step]!.ms)
    return () => clearTimeout(timer)
  }, [step])
  return <IntroWordmark stage={STEPS[step]!.stage} atTop={STEPS[step]!.atTop} />
}
