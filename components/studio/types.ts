import type { ComponentType } from "react"

export type PropType = "number" | "boolean" | "color" | "colorArray" | "select" | "text"
export type PropValue = number | boolean | string | string[]
export type Props = Record<string, PropValue>

export type PropDefinition = {
  name: string
  label: string
  type: PropType
  default: PropValue
  /** `number` */
  min?: number
  max?: number
  step?: number
  /** `select` */
  options?: readonly string[]
  /** `colorArray` */
  minItems?: number
  maxItems?: number
}

export type Preset = { value: string; label: string; props: Props }

/** What the frame renders: a registry component, called with the studio's props. */
export type StudioComponent = ComponentType<Props>

export type StudioEntry = {
  /** The registry item name. Also the `bg` value in the URL and the docs path. */
  id: string
  label: string
  description: string
  /** Colours for the list thumbnail, darkest first. */
  swatch: string[]
  load: () => Promise<StudioComponent>
  props: PropDefinition[]
  presets?: Preset[]
  /** Overrides on top of the defaults, per site theme, so every background reads on the page colour. */
  darkProps?: Props
  lightProps?: Props
  /** A background that can only change a prop by starting over is remounted on every edit. */
  forceRemountOnPropChange?: boolean
}

/** Everything the URL carries: which background, which preset, and only the props that differ from the base. */
export type Doc = { id: string; preset: string | null; changes: Props }
