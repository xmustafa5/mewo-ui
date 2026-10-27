import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { customize } from "@/components/customize"
import { FRAMED } from "@/components/customize/sections"

export const metadata: Metadata = { robots: { index: false } }

export function generateStaticParams() {
  return FRAMED.map((name) => ({ name }))
}

/**
 * A section's preview for its Customize panel: the section alone on a page, drawn from the values the panel on
 * the docs page sends into this frame.
 */
export default async function FramedCustomizePage({ params }: PageProps<"/preview/[name]/customize">) {
  const { name } = await params
  const load = FRAMED.includes(name) ? customize[name] : undefined
  if (!load) notFound()
  const { Framed } = await load()
  if (!Framed) notFound()
  return <Framed />
}
