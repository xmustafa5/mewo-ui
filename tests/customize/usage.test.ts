import { describe, expect, it } from "vitest"
import { changedProps, formatValue, tokenize, usageText } from "@/components/customize/usage"

describe("changedProps", () => {
  it("keeps the props that differ from their defaults and skips demo-only keys", () => {
    const defaults = { duration: 2, text: "Hi", colors: ["#111", "#222"], loop: false }
    const values = { duration: 3, text: "Yo", colors: ["#111", "#222"], loop: true }
    expect(changedProps(values, defaults, ["text"])).toEqual({ duration: 3, loop: true })
  })

  it("adds the computed props a piece derives", () => {
    expect(changedProps({ picture: 2 }, { picture: 1 }, ["picture"], { src: "x.jpg" })).toEqual({ src: "x.jpg" })
  })
})

describe("formatValue", () => {
  it("prints each type as JSX", () => {
    expect(formatValue("a")).toBe('"a"')
    expect(formatValue('say "hi"')).toBe('{"say \\"hi\\""}')
    expect(formatValue(3.5)).toBe("{3.5}")
    expect(formatValue(true)).toBeNull()
    expect(formatValue(false)).toBe("{false}")
    expect(formatValue(["#a", "#b"])).toBe('{["#a", "#b"]}')
  })
})

describe("usageText", () => {
  it("is the import and a bare element at the defaults", () => {
    expect(usageText({ name: "TextShimmer", item: "text-shimmer", props: {}, children: "Hello" })).toBe('import { TextShimmer } from "@/components/ui/text-shimmer"\n\n<TextShimmer>Hello</TextShimmer>')
    expect(usageText({ name: "DotGrid", item: "dot-grid", props: {} })).toContain("<DotGrid />")
  })

  it("puts the changed props on the element, true as the bare prop", () => {
    const text = usageText({ name: "Marquee", item: "marquee", props: { speed: 40, pause: true } })
    expect(text).toContain("<Marquee speed={40} pause />")
  })

  it("stacks long prop lists one per line and indents the children", () => {
    const text = usageText({
      name: "ZoomPicture",
      item: "zoom-picture",
      props: { src: "https://picsum.photos/seed/mewo-zoom-picture-3/1000/1200", alt: "A field after rain" },
      children: '<p className="text-2xl">Who made it</p>',
    })
    expect(text).toBe(
      [
        'import { ZoomPicture } from "@/components/ui/zoom-picture"',
        "",
        "<ZoomPicture",
        '  src="https://picsum.photos/seed/mewo-zoom-picture-3/1000/1200"',
        '  alt="A field after rain"',
        ">",
        '  <p className="text-2xl">Who made it</p>',
        "</ZoomPicture>",
      ].join("\n"),
    )
  })

  it("leaves out props that are undefined", () => {
    expect(usageText({ name: "X", item: "x", props: { a: undefined, b: 1 } })).toContain("<X b={1} />")
  })
})

describe("tokenize", () => {
  it("splits the snippet into tokens that join back to the text", () => {
    const text = usageText({ name: "Marquee", item: "marquee", props: { speed: 40, pause: true }, children: "Hello <b>there</b>" })
    const lines = tokenize(text)
    expect(lines.map((line) => line.map((token) => token.text).join("")).join("\n")).toBe(text)
  })

  it("names the kinds the colours hang on", () => {
    const [importLine, , element] = tokenize('import { A } from "@/components/ui/a"\n\n<A size={2} name="x" on>text</A>')
    expect(importLine.filter((token) => token.kind === "keyword").map((token) => token.text)).toEqual(["import", "from"])
    expect(importLine.find((token) => token.kind === "string")?.text).toBe('"@/components/ui/a"')
    const kinds = Object.fromEntries(element.map((token) => [token.text, token.kind]))
    expect(kinds).toMatchObject({ A: "tag", size: "attr", "{2}": "value", name: "attr", '"x"': "string", on: "attr", text: "text" })
  })
})
