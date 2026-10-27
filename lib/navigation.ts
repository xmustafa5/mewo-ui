import { getGroups, type RegistryItem } from "@/lib/registry"
import type { SearchEntry } from "@/components/site/search"

export const DOCS_PAGES = [
  { href: "/docs", title: "Introduction", description: "What mewo is and how installing works." },
  { href: "/docs/components", title: "Components", description: "Every component and section, with a preview of each." },
  { href: "/sites", title: "Sites", description: "Whole sites built with mewo pieces: scroll them here, and see which piece is which." },
] as const

export const TOOL_PAGES = [
  { href: "/studio", title: "Background Studio", description: "Tune a background live, then export the code, an image or a video." },
] as const

/** Every page search can land on: the docs pages, the tools, then each item in sidebar order. */
export function getSearchEntries(): SearchEntry[] {
  const docs = DOCS_PAGES.map((page) => ({ ...page, section: "Docs" }))
  const tools = TOOL_PAGES.map((page) => ({ ...page, section: "Tools" }))
  const items = getGroups().flatMap((group) =>
    group.items.map((item) => ({
      href: `/docs/${item.name}`,
      title: item.title,
      section: group.label,
      description: item.description,
    }))
  )
  return [...docs, ...tools, ...items]
}

/** The items either side of `name` in sidebar order, for the previous/next links under a page. */
export function getNeighbours(name: string): { previous?: RegistryItem; next?: RegistryItem } {
  const ordered = getGroups().flatMap((group) => group.items)
  const index = ordered.findIndex((item) => item.name === name)
  if (index === -1) return {}
  return { previous: ordered[index - 1], next: ordered[index + 1] }
}
