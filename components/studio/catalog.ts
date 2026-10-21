import { getItem } from "@/lib/registry"
import { NAMESPACE } from "@/lib/site"
import type { Preset, PropDefinition, Props, StudioComponent, StudioEntry } from "./types"

/**
 * The backgrounds the studio can show, with the prop schema that drives the controls. An entry's `id` is a
 * registry item in the `background` category; its title and description come from `registry.json` so the
 * studio and the docs never disagree.
 */

export const DEFAULT_BACKGROUND = "pattern-waves"

/** Fallbacks for the page colour behind a snapshot, used when the live page colour cannot be read. */
export const PAGE_FILL = { dark: "#0b0c12", light: "#fcfcfe" } as const

type Definition = Omit<StudioEntry, "label" | "description">

const define = (definition: Definition): StudioEntry => {
  const item = getItem(definition.id)
  if (!item) throw new Error(`Studio entry "${definition.id}" is not in registry.json`)
  return { ...definition, label: item.title, description: item.description }
}

const loader =
  <M>(importer: () => Promise<M>, pick: (module: M) => unknown) =>
  () =>
    importer().then((module) => pick(module) as StudioComponent)

const number = (name: string, label: string, def: number, min: number, max: number, step: number): PropDefinition => ({
  name,
  label,
  type: "number",
  default: def,
  min,
  max,
  step,
})
const boolean = (name: string, label: string, def: boolean): PropDefinition => ({
  name,
  label,
  type: "boolean",
  default: def,
})
const color = (name: string, label: string, def: string): PropDefinition => ({
  name,
  label,
  type: "color",
  default: def,
})
const select = (name: string, label: string, def: string, options: readonly string[]): PropDefinition => ({
  name,
  label,
  type: "select",
  default: def,
  options,
})

const PATTERN_WAVES_SURFACES: Preset[] = [
  {
    value: "silk",
    label: "Silk",
    props: {
      pattern: "dot",
      wave: "silk",
      spacing: 9,
      markSize: 0.95,
      depth: 0.95,
      light: 0,
      shine: 0.8,
      contrast: 1.2,
      speed: 0.35,
      scale: 1,
      direction: 20,
    },
  },
  {
    value: "ocean",
    label: "Ocean",
    props: {
      pattern: "dot",
      wave: "swell",
      spacing: 10,
      markSize: 0.9,
      depth: 0.42,
      light: 0,
      shine: 1,
      contrast: 1.2,
      speed: 0.5,
      scale: 1,
      direction: 100,
    },
  },
  {
    value: "pond",
    label: "Pond",
    props: {
      pattern: "dot",
      wave: "ripple",
      spacing: 10,
      markSize: 0.9,
      depth: 0.55,
      light: 0,
      shine: 1.2,
      contrast: 1.2,
      speed: 0.5,
      scale: 1,
      direction: 35,
    },
  },
  {
    value: "lines",
    label: "Lines",
    props: {
      pattern: "line",
      wave: "silk",
      spacing: 12,
      markSize: 0.42,
      depth: 0.9,
      light: 0,
      shine: 0.6,
      contrast: 1.2,
      speed: 0.3,
      scale: 1,
      direction: 20,
    },
  },
  {
    value: "terminal",
    label: "Terminal",
    props: {
      pattern: "glyph",
      wave: "ripple",
      spacing: 13,
      markSize: 0.95,
      depth: 0.75,
      light: 0,
      shine: 0.9,
      contrast: 1.4,
      speed: 0.3,
      scale: 1.1,
      direction: 200,
    },
  },
  {
    value: "mesh",
    label: "Mesh",
    props: {
      pattern: "plus",
      wave: "silk",
      spacing: 14,
      markSize: 0.8,
      depth: 0.95,
      light: 0,
      shine: 1,
      contrast: 1.45,
      speed: 0.4,
      scale: 1.1,
      direction: 325,
    },
  },
]

const ENTRIES: Definition[] = [
  {
    id: "pattern-waves",
    swatch: ["#0b0c12", "#3a3446", "#ffffff"],
    load: loader(
      () => import("@/registry/mewo/ui/pattern-waves"),
      (module) => module.PatternWaves,
    ),
    props: [
      color("color", "Color", "#ffffff"),
      color("backgroundColor", "Background", "#000000"),
      select("pattern", "Pattern", "dot", ["dot", "square", "plus", "line", "glyph"]),
      select("wave", "Wave", "silk", ["silk", "swell", "ripple"]),
      { name: "characters", label: "Characters", type: "text", default: ".:-=+*#%@" },
      number("spacing", "Spacing", 9, 5, 30, 1),
      number("markSize", "Mark size", 0.95, 0.3, 1, 0.05),
      number("depth", "Depth", 0.95, 0, 1.5, 0.05),
      number("light", "Light", 0, -90, 90, 1),
      number("shine", "Shine", 0.8, 0, 2, 0.05),
      number("contrast", "Contrast", 1.2, 0.5, 2.5, 0.05),
      number("speed", "Speed", 0.35, 0, 2, 0.05),
      number("scale", "Scale", 1, 0.3, 3, 0.05),
      number("direction", "Direction", 20, 0, 360, 1),
      select("fade", "Fade", "edges", ["edges", "center", "bottom", "top", "none"]),
      number("fadeSize", "Fade size", 0.5, 0.1, 1, 0.05),
      number("opacity", "Opacity", 1, 0, 1, 0.05),
      boolean("interactive", "Interactive", true),
      number("cursorSize", "Cursor size", 50, 10, 200, 5),
      number("cursorStrength", "Cursor strength", 0.6, 0, 1, 0.05),
      boolean("intro", "Intro", true),
      boolean("paused", "Paused", false),
    ],
    presets: PATTERN_WAVES_SURFACES,
    darkProps: { backgroundColor: PAGE_FILL.dark },
    lightProps: { color: "#18181b", backgroundColor: PAGE_FILL.light },
  },
  {
    id: "grainient",
    swatch: ["#120f17", "#9a3412", "#f97316", "#fed7aa"],
    load: loader(
      () => import("@/registry/mewo/ui/grainient"),
      (module) => module.Grainient,
    ),
    props: [
      {
        name: "colors",
        label: "Colors",
        type: "colorArray",
        default: ["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"],
        minItems: 2,
        maxItems: 8,
      },
      select("type", "Type", "linear", ["linear", "radial"]),
      number("angle", "Angle", 55, 0, 360, 1),
      number("bands", "Bands", 1, 1, 6, 1),
      number("softness", "Softness", 1, 0, 1, 0.01),
      number("flow", "Flow", 0.8, 0, 2, 0.05),
      number("scale", "Scale", 1, 0.25, 3, 0.05),
      number("speed", "Speed", 1, 0, 3, 0.05),
      number("silk", "Silk", 0.35, 0, 1, 0.01),
      number("grainAmount", "Grain amount", 0.08, 0, 0.3, 0.01),
      number("grainSize", "Grain size", 1.2, 0.5, 4, 0.1),
      number("contrast", "Contrast", 1, 0.5, 1.6, 0.01),
      number("saturation", "Saturation", 1, 0, 2, 0.01),
      number("variation", "Variation", 0, 0, 20, 1),
      number("stir", "Stir", 1, 0, 2, 0.05),
      boolean("grainAnimated", "Animated grain", true),
      boolean("interactive", "Interactive", true),
      boolean("clickSwirl", "Click swirl", true),
      boolean("intro", "Intro", true),
      boolean("lightMode", "Light mode", false),
    ],
    presets: [
      { value: "ember", label: "Ember", props: { colors: ["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"] } },
      {
        value: "cobalt",
        label: "Cobalt",
        props: { colors: ["#0b0c12", "#101a5a", "#1821fb", "#6b8cff", "#dfe6ff"], angle: 35 },
      },
      {
        value: "ocean",
        label: "Ocean",
        props: { colors: ["#0b1020", "#0f2a4a", "#1d6fa5", "#5ec8f2", "#dff6ff"], angle: 120 },
      },
      {
        value: "mint",
        label: "Mint",
        props: { colors: ["#0a1410", "#0f3b2e", "#16a085", "#7ee8c1", "#e6fff5"], type: "radial" },
      },
      {
        value: "mono",
        label: "Mono",
        props: { colors: ["#0b0b0e", "#2a2a32", "#6b6b78", "#c9c9d2", "#f4f4f7"], saturation: 0, grainAmount: 0.14 },
      },
    ],
    lightProps: { lightMode: true },
  },
  {
    id: "dot-grid",
    swatch: ["#0b0c12", "#3a3446", "#ffffff"],
    load: loader(
      () => import("@/registry/mewo/ui/dot-grid"),
      (module) => module.DotGrid,
    ),
    props: [
      color("baseColor", "Base color", "#3a3446"),
      color("activeColor", "Active color", "#ffffff"),
      select("shape", "Shape", "circle", ["circle", "square"]),
      number("dotSize", "Dot size", 5, 2, 16, 1),
      number("gap", "Gap", 18, 4, 48, 1),
      number("proximity", "Proximity", 140, 40, 320, 5),
      number("strength", "Strength", 1, 0, 2.5, 0.05),
      number("bounce", "Bounce", 0.6, 0, 1, 0.05),
      number("tension", "Tension", 0.4, 0, 1, 0.05),
      number("returnDuration", "Return duration", 0.8, 0.2, 3, 0.05),
      number("shockRadius", "Shock radius", 320, 80, 800, 10),
      number("shockStrength", "Shock strength", 5, 0, 12, 0.5),
      number("swell", "Swell", 0.8, 0, 2, 0.05),
      number("stretch", "Stretch", 0.5, 0, 2, 0.05),
      number("glow", "Glow", 0.5, 0, 1.5, 0.05),
      number("fade", "Fade", 0, 0, 1, 0.05),
      number("opacity", "Opacity", 1, 0, 1, 0.05),
      boolean("mouseInteraction", "Mouse interaction", true),
      boolean("clickShock", "Click shock", true),
      boolean("intro", "Intro", true),
      boolean("paused", "Paused", false),
    ],
    presets: [
      { value: "classic", label: "Classic", props: {} },
      { value: "cobalt", label: "Cobalt", props: { baseColor: "#1b1f3a", activeColor: "#6b8cff", glow: 0.9 } },
      { value: "square", label: "Square", props: { shape: "square", dotSize: 4, gap: 14, swell: 1.2 } },
      { value: "loose", label: "Loose", props: { gap: 32, dotSize: 6, proximity: 220, strength: 1.5, bounce: 0.8 } },
    ],
    lightProps: { baseColor: "#d4d4d8", activeColor: "#18181b", glow: 0.25 },
  },
]

export const CATALOG: StudioEntry[] = ENTRIES.map(define).sort((a, b) => a.label.localeCompare(b.label))

const BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]))

export const findEntry = (id: string | null | undefined): StudioEntry | null => (id ? (BY_ID.get(id) ?? null) : null)

export function defaultProps(entry: StudioEntry): Props {
  const props: Props = {}
  for (const definition of entry.props) props[definition.name] = definition.default
  return props
}

/** The defaults plus the theme overrides: what the studio shows before any preset or edit. */
export function themeDefaults(entry: StudioEntry, light: boolean): Props {
  return { ...defaultProps(entry), ...(light ? entry.lightProps : entry.darkProps) }
}

export function presetProps(entry: StudioEntry, value: string | null): Props {
  if (!value) return {}
  return entry.presets?.find((preset) => preset.value === value)?.props ?? {}
}

export function matchesQuery(entry: StudioEntry, query: string) {
  const text = query.trim().toLowerCase()
  if (!text) return true
  return entry.label.toLowerCase().includes(text) || entry.description.toLowerCase().includes(text)
}

export const docsPath = (entry: StudioEntry) => `/docs/${entry.id}`

export const installCommand = (entry: StudioEntry) => `npx shadcn@latest add ${NAMESPACE}/${entry.id}`
