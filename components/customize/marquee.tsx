"use client"

import { Marquee } from "@/registry/mewo/ui/marquee"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Direction = "left" | "right"

export const DEFAULTS = { direction: "left" as Direction, speed: 30, pauseOnHover: true, repeat: 4, items: 6 }
export const DEMO_ONLY = ["items"] as const

const NAMES = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"]
const ITEM_CLASS = "text-xl font-semibold text-muted-foreground/70"
const DIRECTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const

export default function MarqueeCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  // fewer items than fill the track show why `repeat` matters: the loop is seamless only while the copies cover the box
  const names = NAMES.slice(0, values.items)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{
        name: "Marquee",
        item: "marquee",
        props: changedProps(values, defaults, DEMO_ONLY),
        children: names.map((name) => `<span className="${ITEM_CLASS}">${name}</span>`).join("\n"),
      }}
      preview={
        <Marquee
          direction={values.direction}
          speed={values.speed}
          pauseOnHover={values.pauseOnHover}
          repeat={values.repeat}
          className="w-full max-w-xl [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        >
          {names.map((name) => (
            <span key={name} className={ITEM_CLASS}>
              {name}
            </span>
          ))}
        </Marquee>
      }
    >
      <Select label="Direction" options={DIRECTIONS} value={values.direction} onChange={(value) => set("direction", value)} />
      <Slider label="Speed" min={5} max={60} step={1} unit="s" value={values.speed} onChange={(value) => set("speed", value)} />
      <Switch label="Pause on hover" checked={values.pauseOnHover} onChange={(value) => set("pauseOnHover", value)} />
      <Slider label="Repeat" min={2} max={8} step={1} value={values.repeat} onChange={(value) => set("repeat", value)} />
      <Slider label="Items" min={1} max={NAMES.length} step={1} value={values.items} onChange={(value) => set("items", value)} />
    </CustomizeFrame>
  )
}
