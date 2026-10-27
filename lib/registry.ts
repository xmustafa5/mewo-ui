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
  /**
   * Site-only facts about the item. `added` is the ISO date it joined the catalog. `unlisted` marks a simple
   * piece that ships with a site built with mewo: it keeps its page and installs like any item, but the
   * catalog, the sidebar, search and the counts leave it out.
   */
  meta?: { added?: string; unlisted?: boolean }
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

/** The catalog group whose members replace a shadcn component of the same name. */
const DROPIN_GROUP: Group = "primitives"

/** Items added within this many days of the newest one carry a "New" badge: the latest release. */
const NEW_WINDOW_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

export function createRegistry(items: RegistryItem[]) {
  const getItem = (name: string) => items.find((i) => i.name === name)
  const isUnlisted = (item: RegistryItem) => item.meta?.unlisted === true
  /** The catalog: every item that is not unlisted. */
  const listed = items.filter((item) => !isUnlisted(item))

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

  // the newest listed item opens the "New" window; an unlisted one added later does not move it
  const addedTimes = listed.map((item) => Date.parse(item.meta?.added ?? "")).filter((time) => !Number.isNaN(time))
  const latest = addedTimes.length ? Math.max(...addedTimes) : Number.NaN

  return {
    /** The items the catalog shows. Unlisted items are left out; `getAllItems` has every item. */
    getItems: () => listed,
    /** Every item, unlisted ones included: for the pages and previews that exist for each of them. */
    getAllItems: () => items,
    isUnlisted,
    /** True for the latest release: added within two weeks of the newest item. Deterministic, no clock. */
    isNew: (item: RegistryItem) => {
      const added = Date.parse(item.meta?.added ?? "")
      return !Number.isNaN(added) && latest - added <= NEW_WINDOW_DAYS * DAY_MS
    },
    getItem,
    getDependencies,
    isBlock: (item: RegistryItem) => item.type === "registry:block",
    /**
     * Drop-ins replace a shadcn component of the same name, so installing one OVERWRITES a file
     * in the consumer's working app. The `primitives` category already marks exactly this set —
     * it exists for no other reason — so it carries the flag rather than a duplicate field in
     * registry.json, which would ship to consumers without meaning anything to the shadcn CLI.
     */
    isDropIn: (item: RegistryItem) => item.categories?.[0] === DROPIN_GROUP,
    getGroups: (): RegistryGroup[] =>
      GROUP_ORDER.map((group) => ({
        group,
        label: GROUP_LABELS[group],
        items: listed.filter((i) => i.categories?.[0] === group),
      })).filter((g) => g.items.length > 0),
  }
}

const defaultRegistry = createRegistry(registry.items as RegistryItem[])
export const { getItems, getAllItems, getItem, getDependencies, isBlock, isDropIn, isNew, isUnlisted, getGroups } = defaultRegistry
