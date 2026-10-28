import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { customize } from "@/components/customize"
import { demos } from "@/components/demos"
import { BlockPreview } from "@/components/site/block-preview"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentPreview } from "@/components/site/component-preview"
import { DependencyBadges } from "@/components/site/dependency-badges"
import { DownloadNote } from "@/components/site/download-note"
import { PageNav, SectionHeading } from "@/components/site/docs-ui"
import { DropInWarning } from "@/components/site/dropin-warning"
import { InstallCommand } from "@/components/site/install-command"
import { PropsTable } from "@/components/site/props-table"
import { UnlistedNote } from "@/components/site/unlisted-note"
import { getNeighbours } from "@/lib/navigation"
import { GROUP_LABELS, getAllItems, getDependencies, getItem, isBlock, isDropIn, isUnlisted, type Group } from "@/lib/registry"
import { sitesWith } from "@/lib/sites"
import { displaySource } from "@/lib/source"

// unlisted items have a page too: only the catalog, the sidebar and search leave them out
export function generateStaticParams() {
  return getAllItems().map((item) => ({ name: item.name }))
}

export async function generateMetadata({ params }: PageProps<"/docs/[name]">): Promise<Metadata> {
  const { name } = await params
  const item = getItem(name)
  return item ? { title: item.title, description: item.description } : {}
}

export default async function ItemPage({ params }: PageProps<"/docs/[name]">) {
  const { name } = await params
  const item = getItem(name)
  const loadDemo = demos[name]
  if (!item || !loadDemo) notFound()

  const { default: Demo, props } = await loadDemo()
  // an item with a customize module shows its panel under the preview; the demo still feeds the props table
  const Customized = customize[name] ? (await customize[name]()).default : null
  const source = displaySource(await readFile(path.join(process.cwd(), item.files[0].path), "utf8"))
  const code = <CodeBlock code={source} />
  const group = item.categories?.[0] as Group | undefined
  const unlisted = isUnlisted(item)
  const seenIn = sitesWith(item.name)
  // an unlisted item is in no group page, so it has no neighbours and its crumb does not link
  const { previous, next } = getNeighbours(item.name)

  // The section links and the repo card sit in the docs layout's right rail.
  return (
    <article className="min-w-0 space-y-12">
      <header>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/docs/components" className="transition-colors hover:text-foreground">
            Components
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          {group && !unlisted ? (
            <Link href={`/docs/category/${group}`} className="transition-colors hover:text-foreground">
              {GROUP_LABELS[group]}
            </Link>
          ) : (
            <span>{group ? GROUP_LABELS[group] : isBlock(item) ? "Sections" : "Components"}</span>
          )}
        </nav>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{item.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{item.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isDropIn(item) ? (
            <span className="inline-flex items-center rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-brand-foreground">
              Drop-in replacement
            </span>
          ) : null}
          {unlisted ? (
            <span className="inline-flex items-center rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              Unlisted
            </span>
          ) : null}
          <DependencyBadges dependencies={getDependencies(item)} />
        </div>
        {unlisted ? <UnlistedNote className="mt-5 max-w-2xl" /> : null}
        {seenIn.length ? (
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Seen in</span>
            {seenIn.map((site) => (
              <Link
                key={site.slug}
                href={`/sites/${site.slug}?piece=${item.name}`}
                className="inline-flex items-center gap-1 rounded-lg border bg-card/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                {site.title}
                <ChevronRight className="size-3" aria-hidden />
              </Link>
            ))}
          </p>
        ) : null}
      </header>

      {Customized ? (
        <Customized code={code} />
      ) : isBlock(item) ? (
        <BlockPreview name={item.name} code={code} />
      ) : (
        <ComponentPreview code={code}>
          <Demo />
        </ComponentPreview>
      )}

      <section className="space-y-4">
        <SectionHeading id="install">Install</SectionHeading>
        {isDropIn(item) ? <DropInWarning name={item.name} /> : null}
        <InstallCommand name={item.name} isBlock={isBlock(item)} />
        {item.meta?.downloads?.length ? <DownloadNote files={item.meta.downloads} /> : null}
      </section>

      <section className="space-y-4">
        <SectionHeading id="props">Props</SectionHeading>
        <PropsTable props={props} />
      </section>

      <section className="space-y-4">
        <SectionHeading id="source">Source</SectionHeading>
        {code}
      </section>

      {previous || next ? <PageNav previous={previous} next={next} /> : null}
    </article>
  )
}
