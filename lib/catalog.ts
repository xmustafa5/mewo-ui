import fs from "node:fs"
import path from "node:path"
import type { CatalogEntry } from "@/components/site/catalog/catalog-filter"
import { getGroups, isNew } from "@/lib/registry"

/** Server only: reads `public/previews` at build time. */
const PREVIEWS = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "previews")

/** An item shows its poster only when `public/previews` holds one for both themes. */
export const hasPreview = (name: string) =>
  ["dark", "light"].every((theme) => fs.existsSync(path.join(PREVIEWS, `${name}-${theme}.webp`)))

/** Every item as a catalog card, in sidebar order. */
export function getCatalogEntries(): CatalogEntry[] {
  return getGroups().flatMap((group) =>
    group.items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      group: group.group,
      groupLabel: group.label,
      added: item.meta?.added ?? "",
      isNew: isNew(item),
      hasPreview: hasPreview(item.name),
    })),
  )
}
