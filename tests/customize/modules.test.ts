import { describe, expect, it } from "vitest"
import { customize } from "@/components/customize"
import { demos } from "@/components/demos"
import registry from "@/registry.json"

/** A props-table default as a value, when it is written as one: `"2"` → 2, `'""'` → "", `true` → true. */
const literal = (text: string | undefined): unknown => {
  if (text === undefined) return undefined
  if (text === "true" || text === "false") return text === "true"
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if (/^"[^"]*"$/.test(text)) return text.slice(1, -1)
  return undefined
}

describe("customize modules", () => {
  it("belong to items that have a demo", () => {
    for (const name of Object.keys(customize)) {
      expect(
        registry.items.some((item) => item.name === name),
        name,
      ).toBe(true)
      expect(demos, name).toHaveProperty(name)
    }
  })

  it("control every key as a documented prop, unless it is demo-only, with the documented default", async () => {
    for (const [name, load] of Object.entries(customize)) {
      const [module, demo] = await Promise.all([load(), demos[name]()])
      expect(typeof module.default, `${name} default export`).toBe("function")
      expect(module.DEFAULTS, `${name} DEFAULTS`).toBeTruthy()
      const documented = new Map(demo.props.map((prop) => [prop.name, prop]))
      const demoOnly = new Set(module.DEMO_ONLY ?? [])
      for (const [key, value] of Object.entries(module.DEFAULTS)) {
        if (demoOnly.has(key)) continue
        const prop = documented.get(key)
        expect(prop, `${name}: control "${key}" is not a documented prop; list it in DEMO_ONLY if it is the demo's own`).toBeTruthy()
        const expected = literal(prop!.default)
        // an empty string stands for "the piece's own default" when the table's default is not a plain literal
        if (expected !== undefined && value !== "") expect(value, `${name}: default of "${key}"`).toEqual(expected)
      }
      for (const key of demoOnly) expect(module.DEFAULTS, `${name}: DEMO_ONLY key "${key}" has no control`).toHaveProperty(key)
    }
  })
})
