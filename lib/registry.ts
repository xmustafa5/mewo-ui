import registry from "@/registry.json"
import { NAMESPACE } from "@/lib/site"

export type RegistryFile = { path: string; type: string; target?: string }

export type RegistryItem = {
  name: string
  type: "registry:ui" | "registry:block"
  title: string
  description: string
  categories?: string[]
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  css?: Record<string, unknown>
}

export const GROUP_ORDER = ["sections", "primitives", "text", "card", "scroll", "background", "layout"] as const
export type Group = (typeof GROUP_ORDER)[number]

export const GROUP_LABELS: Record<Group, string> = {
  sections: "Sections",
  primitives: "Primitives",
  text: "Text",
  card: "Cards",
  scroll: "Scroll",
  background: "Backgrounds",
  layout: "Layout",
}

export type RegistryGroup = { group: Group; label: string; items: RegistryItem[] }

export function createRegistry(items: RegistryItem[]) {
  const getItem = (name: string) => items.find((i) => i.name === name)

  /** Every npm package an install pulls in, including the ones its registryDependencies carry. */
  const getDependencies = (item: RegistryItem): string[] => {
    const packages = new Set<string>()
    const seen = new Set<string>()
    const walk = (current: RegistryItem | undefined) => {
      if (!current || seen.has(current.name)) return
      seen.add(current.name)
      for (const dep of current.dependencies ?? []) packages.add(dep)
      for (const dep of current.registryDependencies ?? []) {
        if (dep.startsWith(`${NAMESPACE}/`)) walk(getItem(dep.slice(NAMESPACE.length + 1)))
      }
    }
    walk(item)
    return [...packages].sort()
  }

  return {
    getItems: () => items,
    getItem,
    getDependencies,
    isBlock: (item: RegistryItem) => item.type === "registry:block",
    getGroups: (): RegistryGroup[] =>
      GROUP_ORDER.map((group) => ({
        group,
        label: GROUP_LABELS[group],
        items: items.filter((i) => i.categories?.[0] === group),
      })).filter((g) => g.items.length > 0),
  }
}

const defaultRegistry = createRegistry(registry.items as RegistryItem[])
export const { getItems, getItem, getDependencies, isBlock, getGroups } = defaultRegistry
