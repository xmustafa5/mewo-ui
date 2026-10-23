import fs from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import type { CatalogEntry } from "@/components/site/catalog/catalog-filter"
import { ComponentCatalog } from "@/components/site/catalog/component-catalog"
import { getGroups, isNew } from "@/lib/registry"

export const metadata: Metadata = {
  title: "Components",
  description: "Every mewo component and section, with a preview of each.",
}

const PREVIEWS = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "previews")

/** A card shows its poster only when `scripts/capture-previews.mjs` has filmed it in both themes. */
const hasPreview = (name: string) =>
  ["dark", "light"].every((theme) => fs.existsSync(path.join(PREVIEWS, `${name}-${theme}.webp`)))

export default function ComponentsPage() {
  const groups = getGroups()
  const entries: CatalogEntry[] = groups.flatMap((group) =>
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

  return (
    <ComponentCatalog entries={entries} groups={groups.map((group) => ({ value: group.group, label: group.label }))} />
  )
}
