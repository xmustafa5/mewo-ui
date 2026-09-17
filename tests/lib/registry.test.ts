import { describe, expect, it } from "vitest"
import { createRegistry, type RegistryItem } from "@/lib/registry"

const ui = (name: string, group: string, dependencies?: string[]): RegistryItem => ({
  name,
  type: "registry:ui",
  title: name,
  description: "",
  categories: [group],
  dependencies,
  files: [{ path: `registry/mewo/ui/${name}.tsx`, type: "registry:ui" }],
})
const block = (name: string, registryDependencies?: string[], dependencies?: string[]): RegistryItem => ({
  name,
  type: "registry:block",
  title: name,
  description: "",
  categories: ["sections"],
  dependencies,
  registryDependencies,
  files: [{ path: `registry/mewo/blocks/${name}.tsx`, type: "registry:component" }],
})

const reg = createRegistry([
  ui("a", "text", ["gsap"]),
  block("hero", ["button", "@mewo/a", "@mewo/b"], ["lucide-react"]),
  ui("b", "scroll", ["motion"]),
  ui("c", "text"),
])

describe("createRegistry", () => {
  it("getItem finds by name and returns undefined otherwise", () => {
    expect(reg.getItem("a")?.name).toBe("a")
    expect(reg.getItem("nope")).toBeUndefined()
  })

  it("isBlock distinguishes sections from components", () => {
    expect(reg.isBlock(reg.getItem("hero")!)).toBe(true)
    expect(reg.isBlock(reg.getItem("a")!)).toBe(false)
  })

  it("isDropIn flags only the primitives group, the one whose items overwrite a shadcn file", () => {
    const dropins = createRegistry([ui("tabs", "primitives"), ui("a", "text"), block("hero")])
    expect(dropins.isDropIn(dropins.getItem("tabs")!)).toBe(true)
    expect(dropins.isDropIn(dropins.getItem("a")!)).toBe(false)
    expect(dropins.isDropIn(dropins.getItem("hero")!)).toBe(false)
  })

  it("getDependencies walks registryDependencies so a section reports what it really installs", () => {
    expect(reg.getDependencies(reg.getItem("hero")!)).toEqual(["gsap", "lucide-react", "motion"])
    expect(reg.getDependencies(reg.getItem("a")!)).toEqual(["gsap"])
    expect(reg.getDependencies(reg.getItem("c")!)).toEqual([])
  })

  it("getGroups puts sections first, keeps spec order, drops empty groups", () => {
    const groups = reg.getGroups()
    expect(groups.map((g) => g.group)).toEqual(["sections", "text", "scroll"])
    expect(groups[1].items.map((i) => i.name)).toEqual(["a", "c"])
    expect(groups[0].label).toBe("Sections")
  })
})
