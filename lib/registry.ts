import registry from "@/registry.json"

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

export const GROUP_ORDER = ["sections", "text", "card", "scroll", "background", "layout"] as const
export type Group = (typeof GROUP_ORDER)[number]

export const GROUP_LABELS: Record<Group, string> = {
  sections: "Sections",
  text: "Text",
  card: "Cards",
  scroll: "Scroll",
  background: "Backgrounds",
  layout: "Layout",
}

export type RegistryGroup = { group: Group; label: string; items: RegistryItem[] }

export function createRegistry(items: RegistryItem[]) {
  return {
    getItems: () => items,
    getItem: (name: string) => items.find((i) => i.name === name),
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
export const { getItems, getItem, isBlock, getGroups } = defaultRegistry
