"use client"

import { SplitText } from "@/registry/mewo/ui/split-text"
import { Input, Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type By = "chars" | "words"
type Tag = "span" | "h1" | "h2" | "h3" | "p"

export const DEFAULTS = { text: "Words that arrive one at a time", by: "chars" as By, stagger: 0.03, delay: 0, once: true, as: "span" as Tag }
export const DEMO_ONLY = ["text"] as const

const BY_OPTIONS = [
  { value: "chars", label: "Characters" },
  { value: "words", label: "Words" },
] as const
const TAG_OPTIONS = [
  { value: "span", label: "span" },
  { value: "h1", label: "h1" },
  { value: "h2", label: "h2" },
  { value: "h3", label: "h3" },
  { value: "p", label: "p" },
] as const

export default function SplitTextCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "SplitText", item: "split-text", props: changedProps(values, defaults, DEMO_ONLY), children: values.text }}
      preview={
        // keyed on what the entrance reads as it starts, so a customised address plays one clean entrance once its values arrive
        <SplitText
          key={[values.by, values.stagger, values.delay, values.once].join("-")}
          as={values.as}
          by={values.by}
          stagger={values.stagger}
          delay={values.delay}
          once={values.once}
          className="max-w-md text-center text-4xl font-bold tracking-tight"
        >
          {values.text || " "}
        </SplitText>
      }
    >
      <Input label="Text" value={values.text} onChange={(value) => set("text", value)} />
      {/* the split, the timing and the trigger are all read as the entrance starts, so each change plays it again */}
      <Select label="Split by" options={BY_OPTIONS} value={values.by} onChange={(value) => set("by", value, { replay: true })} />
      <Slider label="Stagger" min={0} max={0.2} step={0.01} unit="s" value={values.stagger} onChange={(value) => set("stagger", value, { replay: true })} />
      <Slider label="Delay" min={0} max={2} step={0.1} unit="s" value={values.delay} onChange={(value) => set("delay", value, { replay: true })} />
      <Switch label="Play once" checked={values.once} onChange={(value) => set("once", value, { replay: true })} />
      <Select label="Element" options={TAG_OPTIONS} value={values.as} onChange={(value) => set("as", value)} />
    </CustomizeFrame>
  )
}
