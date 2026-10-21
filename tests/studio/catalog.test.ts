import { describe, expect, it } from "vitest"
import {
  CATALOG,
  DEFAULT_BACKGROUND,
  defaultProps,
  findEntry,
  presetProps,
  themeDefaults,
} from "@/components/studio/catalog"
import { getItem } from "@/lib/registry"

const HEX = /^#[0-9a-fA-F]{3,8}$/

describe("studio catalog", () => {
  it("has entries, sorted by label, and a default that exists", () => {
    expect(CATALOG.length).toBeGreaterThan(0)
    expect(CATALOG.map((entry) => entry.label)).toEqual(
      [...CATALOG].map((e) => e.label).sort((a, b) => a.localeCompare(b)),
    )
    expect(findEntry(DEFAULT_BACKGROUND)).not.toBeNull()
    expect(findEntry("nope")).toBeNull()
    expect(findEntry(null)).toBeNull()
  })

  it("only lists registry items from the background category, with their registry title", () => {
    for (const entry of CATALOG) {
      const item = getItem(entry.id)
      expect(item, entry.id).toBeDefined()
      expect(item?.categories?.[0], entry.id).toBe("background")
      expect(entry.label).toBe(item?.title)
      expect(entry.description).toBe(item?.description)
      expect(entry.swatch.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("gives every prop a default of its own type", () => {
    for (const entry of CATALOG) {
      const names = new Set<string>()
      for (const definition of entry.props) {
        expect(names.has(definition.name), `${entry.id}.${definition.name} is listed twice`).toBe(false)
        names.add(definition.name)
        const where = `${entry.id}.${definition.name}`
        switch (definition.type) {
          case "number":
            expect(typeof definition.default, where).toBe("number")
            expect(definition.min, where).toBeLessThanOrEqual(definition.default as number)
            expect(definition.max, where).toBeGreaterThanOrEqual(definition.default as number)
            break
          case "boolean":
            expect(typeof definition.default, where).toBe("boolean")
            break
          case "color":
            expect(definition.default, where).toMatch(HEX)
            break
          case "colorArray":
            expect(Array.isArray(definition.default), where).toBe(true)
            for (const color of definition.default as string[]) expect(color, where).toMatch(HEX)
            break
          case "select":
            expect(definition.options, where).toContain(definition.default)
            break
          case "text":
            expect(typeof definition.default, where).toBe("string")
        }
      }
    }
  })

  it("presets and theme overrides only touch props that exist", () => {
    for (const entry of CATALOG) {
      const names = new Set(entry.props.map((definition) => definition.name))
      for (const preset of entry.presets ?? []) {
        for (const name of Object.keys(preset.props))
          expect(names.has(name), `${entry.id} preset ${preset.value} sets ${name}`).toBe(true)
      }
      for (const name of Object.keys({ ...entry.darkProps, ...entry.lightProps })) {
        expect(names.has(name), `${entry.id} theme override sets ${name}`).toBe(true)
      }
    }
  })

  it("resolves defaults, theme overrides and presets in that order", () => {
    const entry = findEntry("pattern-waves")!
    expect(Object.keys(defaultProps(entry))).toHaveLength(entry.props.length)
    expect(themeDefaults(entry, false).backgroundColor).toBe(entry.darkProps?.backgroundColor)
    expect(themeDefaults(entry, true).color).toBe("#18181b")
    expect(presetProps(entry, "ocean").wave).toBe("swell")
    expect(presetProps(entry, "nope")).toEqual({})
    expect(presetProps(entry, null)).toEqual({})
  })
})
