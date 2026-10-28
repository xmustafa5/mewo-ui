"use client"

import { DepthImage, type DepthImageProps } from "@/registry/mewo/ui/depth-image"
import { Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type View = NonNullable<DepthImageProps["view"]>
type Fit = NonNullable<DepthImageProps["fit"]>

export const DEFAULTS = {
  view: "lit" as View,
  fit: "cover" as Fit,
  depthFromLight: 0.5,
  depthSmoothing: 7,
  depthContrast: 1.2,
  invertDepth: false,
  displacement: 1.5,
  normalStrength: 1.5,
  detail: 0.8,
  shadowIntensity: 0.7,
  shadowSoftness: 0.1,
  lightIntensity: 6,
  falloff: 2.5,
  elevation: 1.2,
  ambient: 0.02,
  colorPreserve: 0,
  follow: 0.12,
  autoOrbit: true,
  orbitRadius: 0.6,
  orbitDuration: 10,
  paused: false,
}
export const DEMO_ONLY = [] as const

const VIEW_OPTIONS = [
  { value: "lit", label: "Lit" },
  { value: "depth", label: "Depth" },
  { value: "normal", label: "Normals" },
] as const
const FIT_OPTIONS: Fit[] = ["cover", "contain"]

export default function DepthImageCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "DepthImage", item: "depth-image", props: changedProps(values, defaults, DEMO_ONLY) }}
      preview={
        // the image fills its parent, so the preview gives it a box, as the demo does
        <div className="relative h-80 w-full overflow-hidden rounded-xl">
          <DepthImage alt="A photograph relit by a moving light" {...values} />
        </div>
      }
    >
      <Select label="View" options={VIEW_OPTIONS} value={values.view} onChange={(value) => set("view", value)} />
      <Select label="Fit" options={FIT_OPTIONS} value={values.fit} onChange={(value) => set("fit", value)} />
      <Slider label="Depth from light" min={0} max={1} step={0.01} value={values.depthFromLight} onChange={(value) => set("depthFromLight", value)} />
      <Slider label="Depth smoothing" min={0} max={20} step={0.5} value={values.depthSmoothing} onChange={(value) => set("depthSmoothing", value)} />
      <Slider label="Depth contrast" min={0.2} max={3} step={0.05} value={values.depthContrast} onChange={(value) => set("depthContrast", value)} />
      <Switch label="Invert depth" checked={values.invertDepth} onChange={(value) => set("invertDepth", value)} />
      <Slider label="Displacement" min={0} max={3} step={0.05} value={values.displacement} onChange={(value) => set("displacement", value)} />
      <Slider label="Normal strength" min={0} max={4} step={0.05} value={values.normalStrength} onChange={(value) => set("normalStrength", value)} />
      <Slider label="Detail" min={0} max={3} step={0.05} value={values.detail} onChange={(value) => set("detail", value)} />
      <Slider label="Shadow" min={0} max={1} step={0.01} value={values.shadowIntensity} onChange={(value) => set("shadowIntensity", value)} />
      <Slider label="Shadow softness" min={0.01} max={0.5} step={0.005} value={values.shadowSoftness} onChange={(value) => set("shadowSoftness", value)} />
      <Slider label="Light" min={0} max={20} step={0.5} value={values.lightIntensity} onChange={(value) => set("lightIntensity", value)} />
      <Slider label="Falloff" min={0} max={4} step={0.05} value={values.falloff} onChange={(value) => set("falloff", value)} />
      <Slider label="Elevation" min={0.3} max={3} step={0.05} value={values.elevation} onChange={(value) => set("elevation", value)} />
      <Slider label="Ambient" min={0} max={0.5} step={0.01} value={values.ambient} onChange={(value) => set("ambient", value)} />
      <Slider label="Colour preserve" min={0} max={1} step={0.01} value={values.colorPreserve} onChange={(value) => set("colorPreserve", value)} />
      <Slider label="Follow" min={0.01} max={1} step={0.01} value={values.follow} onChange={(value) => set("follow", value)} />
      <Switch label="Auto orbit" checked={values.autoOrbit} onChange={(value) => set("autoOrbit", value)} />
      <Slider label="Orbit radius" min={0} max={1} step={0.01} disabled={!values.autoOrbit} value={values.orbitRadius} onChange={(value) => set("orbitRadius", value)} />
      <Slider label="Orbit duration" min={2} max={30} step={0.5} unit="s" disabled={!values.autoOrbit} value={values.orbitDuration} onChange={(value) => set("orbitDuration", value)} />
      <Switch label="Paused" checked={values.paused} onChange={(value) => set("paused", value)} />
    </CustomizeFrame>
  )
}
