import type { Metadata } from "next"
import { ComponentCatalog } from "@/components/site/catalog/component-catalog"
import { getCatalogEntries } from "@/lib/catalog"
import { getGroups } from "@/lib/registry"

export const metadata: Metadata = {
  title: "Components",
  description: "Every mewo component and section, with a preview of each.",
}

export default function ComponentsPage() {
  return (
    <ComponentCatalog
      entries={getCatalogEntries()}
      groups={getGroups().map((group) => ({ value: group.group, label: group.label }))}
    />
  )
}
