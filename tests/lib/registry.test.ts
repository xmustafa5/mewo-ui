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

  it("an unlisted item keeps its page and its dependencies but leaves the catalog, the groups and the New window", () => {
    const withUnlisted = createRegistry([
      ui("a", "text"),
      { ...ui("plain", "text", ["gsap"]), meta: { added: "2026-10-27", unlisted: true } },
      { ...ui("b", "scroll"), meta: { added: "2026-10-01" } },
      block("hero", ["@mewo/plain"]),
    ])
    expect(withUnlisted.getItems().map((i) => i.name)).toEqual(["a", "b", "hero"])
    expect(withUnlisted.getAllItems().map((i) => i.name)).toEqual(["a", "plain", "b", "hero"])
    expect(withUnlisted.getItem("plain")?.name).toBe("plain")
    expect(withUnlisted.isUnlisted(withUnlisted.getItem("plain")!)).toBe(true)
    expect(withUnlisted.isUnlisted(withUnlisted.getItem("a")!)).toBe(false)
    expect(withUnlisted.getGroups().flatMap((g) => g.items.map((i) => i.name))).toEqual(["hero", "a", "b"])
    // a section that uses an unlisted item still reports what it installs
    expect(withUnlisted.getDependencies(withUnlisted.getItem("hero")!)).toEqual(["gsap"])
    // "b" is the newest listed item, so it is New although "plain" was added later
    expect(withUnlisted.isNew(withUnlisted.getItem("b")!)).toBe(true)
  })
})
