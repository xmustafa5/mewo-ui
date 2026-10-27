"use client"

import { ScrollReveal, type RevealDirection } from "@/registry/mewo/ui/scroll-reveal"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = { direction: "up", distance: 24, delay: 0, duration: 0.6, once: true }
export const DEMO_ONLY = [] as const

const DIRECTION_OPTIONS = [
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "none", label: "Fade only" },
]
// what the first card says: where the content comes from
const FROM: Record<string, string> = { up: "Reveals from below", down: "Reveals from above", left: "Reveals from the right", right: "Reveals from the left", none: "Fades into place" }
// the cards follow one another a beat apart, so the reveal reads as a sequence
const CARD_STAGGER = 0.15

export default function ScrollRevealCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const lines = [FROM[values.direction] ?? FROM.up, "Then the second card", "Then the third"]
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "ScrollReveal", item: "scroll-reveal", props: changedProps(values, defaults, DEMO_ONLY), children: `<p className="text-sm font-medium">${lines[0]}</p>` }}
      preview={
        <div className="grid w-full max-w-md gap-4">
          {lines.map((line, index) => (
            <ScrollReveal
              key={index}
              direction={values.direction as RevealDirection}
              distance={values.distance}
              delay={values.delay + index * CARD_STAGGER}
              duration={values.duration}
              once={values.once}
              className="rounded-lg border p-4"
            >
              <p className="text-sm font-medium">{line}</p>
            </ScrollReveal>
          ))}
        </div>
      }
    >
      {/* the start pose, the timing and the viewport rule are all set as the reveal begins: every change plays from the start */}
      <Select label="Direction" options={DIRECTION_OPTIONS} value={values.direction} onChange={(value) => set("direction", value, { replay: true })} />
      <Slider label="Distance" min={0} max={120} step={4} unit="px" value={values.distance} onChange={(value) => set("distance", value, { replay: true })} />
      <Slider label="Delay" min={0} max={2} step={0.05} unit="s" value={values.delay} onChange={(value) => set("delay", value, { replay: true })} />
      <Slider label="Duration" min={0.1} max={3} step={0.1} unit="s" value={values.duration} onChange={(value) => set("duration", value, { replay: true })} />
      <Switch label="Reveal once" checked={values.once} onChange={(value) => set("once", value, { replay: true })} />
    </CustomizeFrame>
  )
}
