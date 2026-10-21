import type { Doc, PropDefinition, Props, PropValue, StudioEntry } from "./types"

const HEX = /^#?[0-9a-fA-F]{3,8}$/

export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const withHash = (value: string) => (value.startsWith("#") ? value : `#${value}`)

/** Hex colours lose their `#` in the URL; everything else is its plain string form. */
export function serializeValue(value: PropValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => (HEX.test(item) ? item.replace(/^#/, "") : item)).join(",")
  }
  if (typeof value === "string" && value.startsWith("#") && HEX.test(value)) return value.slice(1)
  return String(value)
}

export function parseValue(raw: string, definition: PropDefinition | undefined): PropValue | undefined {
  switch (definition?.type) {
    case "number": {
      const value = Number(raw)
      return Number.isFinite(value) ? value : undefined
    }
    case "boolean":
      return raw === "true"
    case "color":
      return HEX.test(raw) ? withHash(raw) : undefined
    case "colorArray": {
      const colors = raw.split(",").filter((item) => HEX.test(item))
      return colors.length ? colors.map(withHash) : undefined
    }
    case "select":
      return definition.options?.includes(raw) ? raw : undefined
    case "text":
      return raw
    default:
      return undefined
  }
}

type Params = { get(name: string): string | null }

export function readDocument(
  searchParams: Params,
  fallbackId: string,
  getEntry: (id: string | null) => StudioEntry | null,
): Doc {
  const entry = getEntry(searchParams.get("bg")) ?? getEntry(fallbackId)
  if (!entry) throw new Error(`Unknown background: ${fallbackId}`)
  const changes: Props = {}
  for (const definition of entry.props) {
    const raw = searchParams.get(definition.name)
    if (raw === null) continue
    const value = parseValue(raw, definition)
    if (value !== undefined) changes[definition.name] = value
  }
  return { id: entry.id, preset: searchParams.get("preset") || null, changes }
}

export function writeDocument(doc: Doc, entry: StudioEntry | null): URLSearchParams {
  const params = new URLSearchParams()
  params.set("bg", doc.id)
  if (doc.preset) params.set("preset", doc.preset)
  for (const definition of entry?.props ?? []) {
    if (definition.name in doc.changes) params.set(definition.name, serializeValue(doc.changes[definition.name]))
  }
  return params
}
