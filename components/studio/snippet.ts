import type { Props, PropValue, StudioEntry } from "./types"

export type Placement = "section" | "page"

/** `pattern-waves` → `PatternWaves`, the export every background file uses. */
export const componentName = (id: string) =>
  id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

export function formatAttribute(name: string, value: PropValue): string {
  if (typeof value === "string") return `${name}=${JSON.stringify(value)}`
  if (typeof value === "boolean") return value ? name : `${name}={false}`
  if (Array.isArray(value)) return `${name}={[${value.map((item) => JSON.stringify(item)).join(", ")}]}`
  return `${name}={${value}}`
}

/** The code a user pastes: the import as the shadcn CLI writes it, plus only the props they changed. */
export function usageSnippet(entry: StudioEntry, changed: Props, placement: Placement): string {
  const name = componentName(entry.id)
  const attributes = [
    'className="absolute inset-0"',
    ...Object.entries(changed).map(([key, value]) => formatAttribute(key, value)),
  ]
  const indent = placement === "section" ? "      " : "      "
  const element =
    attributes.length > 1
      ? `<${name}\n${attributes.map((attribute) => `${indent}  ${attribute}`).join("\n")}\n${indent}/>`
      : `<${name} ${attributes[0]} />`

  if (placement === "page") {
    return `import { ${name} } from "@/components/ui/${entry.id}"

/** Sits behind the whole page. Render it once, near the top of your layout. */
export function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      ${element}
    </div>
  )
}
`
  }

  return `import { ${name} } from "@/components/ui/${entry.id}"

export function Section() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      ${element}
      <div className="relative z-10">{/* your content */}</div>
    </section>
  )
}
`
}
