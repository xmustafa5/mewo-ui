export type CssValue = string | { [key: string]: CssValue }
export type CssItem = { name: string; css?: Record<string, CssValue> }

const HEADER = "/* GENERATED from registry.json — do not edit */"

/** Turns every item's `css` block into plain CSS so the docs site renders the same keyframes users receive. */
export function serializeCss(items: CssItem[]): string {
  const blocks: string[] = []
  for (const item of items) {
    if (!item.css) continue
    for (const [selector, body] of Object.entries(item.css)) {
      blocks.push(serializeRule(selector, body, item.name, 0))
    }
  }
  return [HEADER, ...blocks].join("\n") + "\n"
}

function serializeRule(selector: string, body: CssValue, itemName: string, depth: number): string {
  if (typeof body !== "object" || body === null) {
    throw new Error(`registry.json item "${itemName}": expected a block for "${selector}", got ${typeof body}`)
  }
  const pad = "  ".repeat(depth)
  const lines = [`${pad}${selector} {`]
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      lines.push(`${pad}  ${key}: ${value};`)
    } else if (typeof value === "object" && value !== null) {
      lines.push(serializeRule(key, value, itemName, depth + 1))
    } else {
      throw new Error(`registry.json item "${itemName}": unsupported value for "${key}" inside "${selector}"`)
    }
  }
  lines.push(`${pad}}`)
  return lines.join("\n")
}
