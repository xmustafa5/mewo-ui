import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { demos } from "@/components/demos"
import { PreviewStage } from "@/components/site/preview-stage"
import { framingFor } from "@/lib/preview-framing"
import { getItem, getItems, isBlock } from "@/lib/registry"

export const metadata: Metadata = { robots: { index: false } }

export function generateStaticParams() {
  return getItems().map((item) => ({ name: item.name }))
}

/**
 * One demo on its own page: sections open here from their docs page, and every item is filmed here for the
 * catalog's poster and hover clip. Sections render as a page; components are framed like a catalog card.
 */
export default async function PreviewPage({ params }: PageProps<"/preview/[name]">) {
  const { name } = await params
  const item = getItem(name)
  const loadDemo = demos[name]
  if (!item || !loadDemo) notFound()

  const { default: Demo } = await loadDemo()
  return (
    <PreviewStage framing={framingFor(item.name, isBlock(item))}>
      <Demo />
    </PreviewStage>
  )
}
