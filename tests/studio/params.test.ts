import { describe, expect, it } from "vitest"
import { findEntry } from "@/components/studio/catalog"
import { parseValue, readDocument, sameValue, serializeValue, writeDocument } from "@/components/studio/params"
import type { PropDefinition } from "@/components/studio/types"

const definition = (type: PropDefinition["type"], extra: Partial<PropDefinition> = {}): PropDefinition => ({
  name: "x",
  label: "X",
  type,
  default: "",
  ...extra,
})

describe("serializeValue", () => {
  it("drops the hash from hex colours and joins arrays with commas", () => {
    expect(serializeValue("#ff0000")).toBe("ff0000")
    expect(serializeValue(["#fff", "#000"])).toBe("fff,000")
    expect(serializeValue(12.5)).toBe("12.5")
    expect(serializeValue(false)).toBe("false")
    expect(serializeValue("glyph")).toBe("glyph")
  })
})

describe("parseValue", () => {
  it("parses each prop type and rejects what does not fit", () => {
    expect(parseValue("12", definition("number"))).toBe(12)
    expect(parseValue("abc", definition("number"))).toBeUndefined()
    expect(parseValue("true", definition("boolean"))).toBe(true)
    expect(parseValue("nope", definition("boolean"))).toBe(false)
    expect(parseValue("ff0000", definition("color"))).toBe("#ff0000")
    expect(parseValue("red", definition("color"))).toBeUndefined()
    expect(parseValue("fff,000", definition("colorArray"))).toEqual(["#fff", "#000"])
    expect(parseValue("red,blue", definition("colorArray"))).toBeUndefined()
    expect(parseValue("glyph", definition("select", { options: ["dot", "glyph"] }))).toBe("glyph")
    expect(parseValue("nope", definition("select", { options: ["dot", "glyph"] }))).toBeUndefined()
    expect(parseValue("any text", definition("text"))).toBe("any text")
    expect(parseValue("1", undefined)).toBeUndefined()
  })
})

describe("readDocument / writeDocument", () => {
  const entry = findEntry("pattern-waves")!

  it("round-trips a document through the URL", () => {
    const doc = {
      id: "pattern-waves",
      preset: "ocean",
      changes: { color: "#ff0000", spacing: 12, interactive: false, pattern: "glyph", characters: "ab c" },
    }
    const params = writeDocument(doc, entry)
    expect(params.get("bg")).toBe("pattern-waves")
    expect(params.get("preset")).toBe("ocean")
    expect(params.get("color")).toBe("ff0000")
    expect(readDocument(params, "dot-grid", findEntry)).toEqual(doc)
  })

  it("ignores unknown props and values that do not parse", () => {
    const params = new URLSearchParams("bg=pattern-waves&spacing=abc&pattern=nope&bogus=1&intro=false")
    expect(readDocument(params, "dot-grid", findEntry)).toEqual({
      id: "pattern-waves",
      preset: null,
      changes: { intro: false },
    })
  })

  it("falls back to the default background for an unknown or missing id", () => {
    expect(readDocument(new URLSearchParams("bg=nope"), "dot-grid", findEntry).id).toBe("dot-grid")
    expect(readDocument(new URLSearchParams(""), "grainient", findEntry).id).toBe("grainient")
  })

  it("writes only props present in the document, in schema order", () => {
    const params = writeDocument({ id: "pattern-waves", preset: null, changes: { spacing: 10, color: "#fff" } }, entry)
    expect([...params.keys()]).toEqual(["bg", "color", "spacing"])
  })
})

describe("sameValue", () => {
  it("compares by value, including arrays", () => {
    expect(sameValue(["#fff"], ["#fff"])).toBe(true)
    expect(sameValue(1, "1")).toBe(false)
  })
})
