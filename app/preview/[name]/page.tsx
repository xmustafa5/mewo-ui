import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { demos } from "@/components/demos"
import { getItem, getItems, isBlock } from "@/lib/registry"

export const metadata: Metadata = { robots: { index: false } }

export function generateStaticParams() {
  return getItems()
    .filter(isBlock)
    .map((item) => ({ name: item.name }))
}

export default async function PreviewPage({ params }: PageProps<"/preview/[name]">) {
  const { name } = await params
  const item = getItem(name)
  const loadDemo = demos[name]
  if (!item || !isBlock(item) || !loadDemo) notFound()

  const { default: Demo } = await loadDemo()
  return <Demo />
}
