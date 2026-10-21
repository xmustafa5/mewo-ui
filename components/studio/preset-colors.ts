import type { PropDefinition, Props } from "./types"

const HEX = /^#[0-9a-fA-F]{3,8}$/

/** Up to three distinct hex colours a preset resolves to, colour props first, for its swatches. */
export function colorsOf(props: Props, definitions: PropDefinition[]): string[] {
  const found: string[] = []
  const add = (value: unknown) => {
    if (typeof value === "string" && HEX.test(value) && !found.includes(value.toLowerCase())) {
      found.push(value.toLowerCase())
    }
  }
  for (const definition of definitions) {
    const value = props[definition.name]
    if (definition.type === "color") add(value)
    if (definition.type === "colorArray" && Array.isArray(value)) value.forEach(add)
  }
  for (const value of Object.values(props)) {
    if (Array.isArray(value)) value.forEach(add)
    else add(value)
  }
  return found.slice(0, 3)
}
