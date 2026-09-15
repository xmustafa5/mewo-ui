import { describe, expect, it } from "vitest"
import { serializeCss } from "@/lib/registry-css"

const HEADER = "/* GENERATED from registry.json — do not edit */"

describe("serializeCss", () => {
  it("serialises nested keyframes with indented declarations", () => {
    const css = serializeCss([
      {
        name: "foo",
        css: {
          "@keyframes foo": {
            from: { "background-position": "200% 0" },
            to: { "background-position": "-200% 0" },
          },
        },
      },
    ])
    expect(css.startsWith(HEADER)).toBe(true)
    expect(css).toContain(
      "@keyframes foo {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}"
    )
  })

  it("skips items without css and still writes the header", () => {
    expect(serializeCss([{ name: "a" }, { name: "b" }])).toBe(`${HEADER}\n`)
  })

  it("throws naming the item when a value is neither string nor block", () => {
    expect(() =>
      serializeCss([{ name: "bad", css: { "@keyframes x": { from: 42 as never } } }])
    ).toThrow(/"bad"/)
  })
})
