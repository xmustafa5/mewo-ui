"use client"

import { BODY_PATH, EYE_PATHS, MARK_VIEWBOX, PIXEL_PATHS } from "@/components/site/mewo-mark"
import { Venom } from "@/registry/mewo/ui/venom"
import { Color } from "./color-picker"
import { Input, Select, Slider, Switch } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Shape = "word" | "icon"

export const DEFAULTS = { shape: "word" as Shape, word: "VENOM", color: "#050507", highlight: "#ffffff", tendrils: 8, reach: 200, writhe: 1, boil: 1, scale: 0.7, speed: 1, paused: false }
export const DEMO_ONLY = ["shape", "word"] as const

const SHAPES = [
  { value: "word", label: "A word" },
  { value: "icon", label: "An icon" },
] as const
// a stand-in for the icon a user would hand the piece: any <svg>, of which only the shape is read
const ICON_CHILDREN = '<svg viewBox="0 0 24 24">\n  <path d="M12 2 2 22h20z" />\n</svg>'

/** The mewo cat as a silhouette: the eyes are cut out of the body (even-odd fill) so the symbiote grows around them. */
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

export default function VenomCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const word = values.shape === "word"
  // the word is the piece's `text` prop; an icon goes in as children instead
  const computed = word ? { text: values.word } : {}
  const look = {
    color: values.color,
    highlight: values.highlight,
    tendrils: values.tendrils,
    reach: values.reach,
    writhe: values.writhe,
    boil: values.boil,
    scale: values.scale,
    speed: values.speed,
    paused: values.paused,
  }
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      fill
      usage={{ name: "Venom", item: "venom", props: changedProps(values, defaults, DEMO_ONLY, computed), children: word ? undefined : ICON_CHILDREN }}
      preview={
        // a box the height of the stage, so the tendrils have all of it to reach across; the symbiote is black in both themes, so both get the same light backdrop
        <div className="relative h-95 w-full overflow-hidden rounded-xl bg-zinc-100">
          {word ? (
            <Venom className="absolute inset-0" text={values.word} {...look} />
          ) : (
            <Venom className="absolute inset-0" {...look}>
              <MewoSilhouette />
            </Venom>
          )}
        </div>
      }
    >
      <Select label="Shape" options={SHAPES} value={values.shape} onChange={(value) => set("shape", value)} />
      <Input label="Word" value={values.word} disabled={!word} onChange={(value) => set("word", value)} />
      <Color label="Colour" value={values.color} onChange={(value) => set("color", value)} />
      <Color label="Highlight" value={values.highlight} onChange={(value) => set("highlight", value)} />
      <Slider label="Tendrils" min={0} max={16} step={1} value={values.tendrils} onChange={(value) => set("tendrils", value)} />
      <Slider label="Reach" min={50} max={500} step={10} unit="px" value={values.reach} onChange={(value) => set("reach", value)} />
      <Slider label="Writhe" min={0} max={3} step={0.1} value={values.writhe} onChange={(value) => set("writhe", value)} />
      <Slider label="Boil" min={0} max={3} step={0.1} value={values.boil} onChange={(value) => set("boil", value)} />
      <Slider label="Scale" min={0.2} max={1} step={0.05} value={values.scale} onChange={(value) => set("scale", value)} />
      <Slider label="Speed" min={0} max={3} step={0.1} value={values.speed} onChange={(value) => set("speed", value)} />
      <Switch label="Paused" checked={values.paused} onChange={(value) => set("paused", value)} />
    </CustomizeFrame>
  )
}
