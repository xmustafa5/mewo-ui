import { describe, expect, it } from "vitest"
import { findEntry } from "@/components/studio/catalog"
import { componentName, formatAttribute, usageSnippet } from "@/components/studio/snippet"

describe("componentName", () => {
  it("turns an item name into its export", () => {
    expect(componentName("pattern-waves")).toBe("PatternWaves")
    expect(componentName("grainient")).toBe("Grainient")
  })
})

describe("formatAttribute", () => {
  it("writes each value the way JSX wants it", () => {
    expect(formatAttribute("color", "#fff")).toBe('color="#fff"')
    expect(formatAttribute("spacing", 12)).toBe("spacing={12}")
    expect(formatAttribute("intro", true)).toBe("intro")
    expect(formatAttribute("intro", false)).toBe("intro={false}")
    expect(formatAttribute("colors", ["#000", "#fff"])).toBe('colors={["#000", "#fff"]}')
  })
})

describe("usageSnippet", () => {
  const entry = findEntry("pattern-waves")!

  it("imports from where the CLI installs and passes only the changed props", () => {
    const code = usageSnippet(entry, { spacing: 12, pattern: "glyph" }, "section")
    expect(code).toContain('import { PatternWaves } from "@/components/ui/pattern-waves"')
    expect(code).toContain('className="absolute inset-0"')
    expect(code).toContain("spacing={12}")
    expect(code).toContain('pattern="glyph"')
    expect(code).toContain("<section")
    expect(code).not.toContain("fixed inset-0")
  })

  it("collapses to one line with no changes and offers a page placement", () => {
    expect(usageSnippet(entry, {}, "section")).toContain('<PatternWaves className="absolute inset-0" />')
    const page = usageSnippet(entry, {}, "page")
    expect(page).toContain("fixed inset-0 -z-10")
    expect(page).not.toContain("<section")
  })
})
