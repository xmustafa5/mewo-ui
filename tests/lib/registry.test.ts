import { describe, expect, it } from "vitest"
import { createRegistry, type RegistryItem } from "@/lib/registry"

const ui = (name: string, group: string): RegistryItem => ({
  name,
  type: "registry:ui",
  title: name,
  description: "",
  categories: [group],
  files: [{ path: `registry/mewo/ui/${name}.tsx`, type: "registry:ui" }],
})
const block = (name: string): RegistryItem => ({
  name,
  type: "registry:block",
  title: name,
  description: "",
  categories: ["sections"],
  files: [{ path: `registry/mewo/blocks/${name}.tsx`, type: "registry:component" }],
})

const reg = createRegistry([ui("a", "text"), block("hero"), ui("b", "scroll"), ui("c", "text")])

describe("createRegistry", () => {
  it("getItem finds by name and returns undefined otherwise", () => {
    expect(reg.getItem("a")?.name).toBe("a")
    expect(reg.getItem("nope")).toBeUndefined()
  })

  it("isBlock distinguishes sections from components", () => {
    expect(reg.isBlock(reg.getItem("hero")!)).toBe(true)
    expect(reg.isBlock(reg.getItem("a")!)).toBe(false)
  })

  it("getGroups puts sections first, keeps spec order, drops empty groups", () => {
    const groups = reg.getGroups()
    expect(groups.map((g) => g.group)).toEqual(["sections", "text", "scroll"])
    expect(groups[1].items.map((i) => i.name)).toEqual(["a", "c"])
    expect(groups[0].label).toBe("Sections")
  })
})
