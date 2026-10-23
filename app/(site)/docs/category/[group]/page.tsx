import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ComponentCatalog } from "@/components/site/catalog/component-catalog"
import { getCatalogEntries } from "@/lib/catalog"
import { getGroups } from "@/lib/registry"

/** One catalog page per category, which the sidebar's category picker opens (React Bits' `/c/<category>`). */
export const dynamicParams = false

export function generateStaticParams() {
  return getGroups().map((group) => ({ group: group.group }))
}

const findGroup = (value: string) => getGroups().find((group) => group.group === value)

export async function generateMetadata({ params }: PageProps<"/docs/category/[group]">): Promise<Metadata> {
  const group = findGroup((await params).group)
  return group ? { title: group.label, description: `Every mewo item in ${group.label}, with a preview of each.` } : {}
}

export default async function CategoryPage({ params }: PageProps<"/docs/category/[group]">) {
  const group = findGroup((await params).group)
  if (!group) notFound()

  const entries = getCatalogEntries().filter((entry) => entry.group === group.group)
  return (
    <ComponentCatalog
      entries={entries}
      groups={[]}
      title={group.label}
      summary={`${entries.length} ${entries.length === 1 ? "item" : "items"} in this category`}
      defaultSort="az"
    />
  )
}
