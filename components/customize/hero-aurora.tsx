"use client"

import { HeroAurora } from "@/registry/mewo/blocks/hero-aurora"
import { Input } from "./controls"
import { CustomizeFrame } from "./frame"
import { FramedPreview, useFramedValues } from "./framed"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

export const DEFAULTS = {
  eyebrow: "Now in v0.1",
  title: "Animated components for React",
  description: "Copy-paste motion for your next project. Install with the shadcn CLI and own the code.",
  primary: "Get started",
  secondary: "Browse components",
}
/** The button labels stand in for the two CTA objects, which the usage builds from them. */
export const DEMO_ONLY = ["primary", "secondary"] as const

const ctas = (values: typeof DEFAULTS) => ({
  ...(values.primary !== DEFAULTS.primary ? { primaryCta: { label: values.primary, href: "#" } } : {}),
  ...(values.secondary !== DEFAULTS.secondary ? { secondaryCta: { label: values.secondary, href: "#" } } : {}),
})

export function Framed() {
  const values = useFramedValues(DEFAULTS)
  return <HeroAurora eyebrow={values.eyebrow} title={values.title} description={values.description} primaryCta={{ label: values.primary, href: "#" }} secondaryCta={{ label: values.secondary, href: "#" }} />
}

export default function HeroAuroraCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "HeroAurora", item: "hero-aurora", block: true, props: changedProps(values, defaults, DEMO_ONLY, ctas(values)) }}
      preview={<FramedPreview name="hero-aurora" values={values} run={run} />}
    >
      <Input label="Eyebrow" value={values.eyebrow} onChange={(value) => set("eyebrow", value)} />
      <Input label="Title" value={values.title} onChange={(value) => set("title", value)} />
      <Input label="Description" value={values.description} onChange={(value) => set("description", value)} />
      <Input label="Primary button" value={values.primary} onChange={(value) => set("primary", value)} />
      <Input label="Secondary button" value={values.secondary} onChange={(value) => set("secondary", value)} />
    </CustomizeFrame>
  )
}
