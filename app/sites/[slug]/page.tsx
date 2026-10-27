import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteViewer } from "@/components/sites/site-viewer"
import { hasPreview } from "@/lib/catalog"
import { frameSrc, getSite, getSites, posterOf, siteOrigin, sitePieces } from "@/lib/sites"

export function generateStaticParams() {
  return getSites().map((site) => ({ slug: site.slug }))
}

export async function generateMetadata({ params }: PageProps<"/sites/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const site = getSite(slug)
  return site ? { title: site.title, description: site.blurb } : {}
}

export default async function SitePage({ params }: PageProps<"/sites/[slug]">) {
  const { slug } = await params
  const site = getSite(slug)
  if (!site) notFound()
  const { listed, unlisted } = sitePieces(site)
  const pieces = [...listed, ...unlisted].map((item) => ({
    name: item.name,
    title: item.title,
    description: item.description,
    hasPreview: hasPreview(item.name),
    unlisted: unlisted.includes(item),
  }))
  return (
    // the whole window under the header (4rem and its border): the framed site is as wide as the window allows, as in its own tab
    <div className="flex h-[calc(100dvh-4rem-1px)] w-full flex-col px-4 py-4 sm:px-6">
      <SiteViewer
        site={{
          slug: site.slug,
          title: site.title,
          blurb: site.blurb,
          url: site.url,
          frame: frameSrc(site),
          origin: siteOrigin(site),
          embed: !!site.embed,
          source: site.source ?? site.slug,
          poster: posterOf(site.slug),
        }}
        pieces={pieces}
      />
    </div>
  )
}
