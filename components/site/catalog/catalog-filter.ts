export type CatalogEntry = {
  name: string
  title: string
  description: string
  group: string
  groupLabel: string
  /** ISO date the item joined the catalog. */
  added: string
  /** Part of the latest release. */
  isNew: boolean
  /** A poster and hover clip exist in public/previews. */
  hasPreview: boolean
}

export type SortMode = "newest" | "az"

export const ALL_GROUPS = "all"

export type CatalogFilter = {
  query: string
  group: string
  /** Show only what is new since the visitor's last visit. */
  newOnly: boolean
}

/** Every word of the query has to appear in the title, description, category or name. */
export function filterEntries(
  entries: CatalogEntry[],
  filter: CatalogFilter,
  seen: ReadonlySet<string>,
): CatalogEntry[] {
  const words = filter.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter((entry) => {
    if (filter.group !== ALL_GROUPS && entry.group !== filter.group) return false
    if (filter.newOnly && !seen.has(entry.name)) return false
    if (words.length === 0) return true
    const haystack = `${entry.title} ${entry.description} ${entry.groupLabel} ${entry.name}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}

/**
 * Newest puts the latest additions first. A to Z puts what is new to this visitor first, then the latest
 * release, then the rest by title, the way React Bits orders its catalog.
 */
export function sortEntries(entries: CatalogEntry[], mode: SortMode, seen: ReadonlySet<string>): CatalogEntry[] {
  const byTitle = (a: CatalogEntry, b: CatalogEntry) => a.title.localeCompare(b.title)
  return [...entries].sort((a, b) => {
    if (mode === "newest") return b.added.localeCompare(a.added) || byTitle(a, b)
    const unseen = Number(seen.has(b.name)) - Number(seen.has(a.name))
    return unseen || Number(b.isNew) - Number(a.isNew) || byTitle(a, b)
  })
}
