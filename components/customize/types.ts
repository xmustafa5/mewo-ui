import type * as React from "react"

/** What a control can hold: the prop types the address can carry. */
export type Primitive = string | number | boolean | string[]
export type Values = Record<string, Primitive>

/** What the item page hands a piece's Customize component: the highlighted source for the Code tab. */
export type CustomizeProps = { code: React.ReactNode }

/** A piece's customize module, `components/customize/<name>.tsx`. */
export type CustomizeModule = {
  default: React.ComponentType<CustomizeProps>
  /** The controls' defaults, one key per control. A key is a prop of the piece unless it is in `DEMO_ONLY`. */
  DEFAULTS: Values
  /** Keys that are not props of the piece (a preset, the demo's own content or size): the usage snippet skips them. */
  DEMO_ONLY?: readonly string[]
}
