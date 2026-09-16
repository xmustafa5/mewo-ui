import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import registry from "@/registry.json"
import { demos } from "@/components/demos"
import type { RegistryItem } from "@/lib/registry"

const items = registry.items as RegistryItem[]
const ui = items.filter((i) => i.type === "registry:ui")
const blocks = items.filter((i) => i.type === "registry:block")

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8")
const importsOf = (src: string) => Array.from(src.matchAll(/from\s+"([^"]+)"/g), (m) => m[1])

const UI_ALLOWED = new Set(["react", "@/lib/utils", "motion/react", "gsap", "gsap/ScrollTrigger", "@gsap/react", "lucide-react"])
const PACKAGE_OF: Record<string, string> = {
  "motion/react": "motion",
  gsap: "gsap",
  "gsap/ScrollTrigger": "gsap",
  "@gsap/react": "@gsap/react",
  "lucide-react": "lucide-react",
}

describe("registry.json", () => {
  it("has items", () => {
    expect(items.length).toBeGreaterThan(0)
  })

  it("names are unique kebab-case", () => {
    const names = items.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it("every item is one file at the path its type requires", () => {
    for (const item of items) {
      expect(item.files, item.name).toHaveLength(1)
      const [file] = item.files
      expect(existsSync(path.join(process.cwd(), file.path)), file.path).toBe(true)
      if (item.type === "registry:ui") {
        expect(file.path).toBe(`registry/mewo/ui/${item.name}.tsx`)
        expect(file.type).toBe("registry:ui")
      } else {
        expect(file.path).toBe(`registry/mewo/blocks/${item.name}.tsx`)
        expect(file.type).toBe("registry:component")
      }
    }
  })

  it("every item has a demo", () => {
    for (const item of items) expect(demos, `demo for ${item.name}`).toHaveProperty(item.name)
  })

  it('every shipped file starts with "use client"', () => {
    for (const item of items) expect(read(item.files[0].path).startsWith('"use client"'), item.name).toBe(true)
  })

  it("css keys are @keyframes, @utility or @media blocks", () => {
    for (const item of items) {
      for (const key of Object.keys(item.css ?? {})) expect(key, item.name).toMatch(/^@(keyframes|utility|media) /)
    }
  })

  it("keyframe names are namespaced so they cannot overwrite a consumer's own", () => {
    for (const item of items) {
      for (const key of Object.keys(item.css ?? {})) {
        const keyframes = key.match(/^@keyframes (.+)$/)
        if (keyframes) expect(keyframes[1], item.name).toMatch(/^mewo-/)
      }
    }
  })

  it("every animation a file references is declared in that item's css", () => {
    for (const item of items) {
      const used = new Set(Array.from(read(item.files[0].path).matchAll(/animate-\[([a-z0-9-]+)_/g), (m) => m[1]))
      const declared = new Set(
        Object.keys(item.css ?? {})
          .map((key) => key.match(/^@keyframes (.+)$/)?.[1])
          .filter((name): name is string => Boolean(name))
      )
      expect(declared, item.name).toEqual(used)
    }
  })

  it("ui items import only allowed modules and never other ui items", () => {
    for (const item of ui) {
      for (const spec of importsOf(read(item.files[0].path))) {
        expect(UI_ALLOWED.has(spec), `${item.name} imports ${spec}`).toBe(true)
      }
    }
  })

  it("blocks declare every registry import as a dependency and import nothing else", () => {
    for (const item of blocks) {
      const deps = new Set(item.registryDependencies ?? [])
      for (const spec of importsOf(read(item.files[0].path))) {
        const uiImport = spec.match(/^@\/registry\/mewo\/ui\/(.+)$/)
        if (uiImport) expect(deps.has(`@mewo/${uiImport[1]}`), `${item.name} must declare @mewo/${uiImport[1]}`).toBe(true)
        if (spec === "@/components/ui/button") expect(deps.has("button"), `${item.name} must declare button`).toBe(true)
        const allowed = UI_ALLOWED.has(spec) || uiImport !== null || spec === "@/components/ui/button"
        expect(allowed, `${item.name} imports ${spec}`).toBe(true)
      }
    }
  })

  it("dependencies list exactly the npm packages the file imports", () => {
    for (const item of items) {
      const expected = new Set(importsOf(read(item.files[0].path)).map((s) => PACKAGE_OF[s]).filter(Boolean))
      expect(new Set(item.dependencies ?? []), item.name).toEqual(expected)
    }
  })
})
