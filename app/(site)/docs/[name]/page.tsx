import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { demos } from "@/components/demos"
import { BlockPreview } from "@/components/site/block-preview"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentPreview } from "@/components/site/component-preview"
import { DependencyBadges } from "@/components/site/dependency-badges"
import { OnThisPage, PageNav, SectionHeading, StarCard } from "@/components/site/docs-ui"
import { DropInWarning } from "@/components/site/dropin-warning"
import { InstallCommand } from "@/components/site/install-command"
import { PropsTable } from "@/components/site/props-table"
import { getNeighbours } from "@/lib/navigation"
import { GROUP_LABELS, getDependencies, getItem, getItems, isBlock, isDropIn, type Group } from "@/lib/registry"
import { displaySource } from "@/lib/source"

export function generateStaticParams() {
  return getItems().map((item) => ({ name: item.name }))
}

export async function generateMetadata({ params }: PageProps<"/docs/[name]">): Promise<Metadata> {
  const { name } = await params
  const item = getItem(name)
  return item ? { title: item.title, description: item.description } : {}
}

const SECTIONS = [
  { id: "install", label: "Install" },
  { id: "props", label: "Props" },
  { id: "source", label: "Source" },
]

export default async function ItemPage({ params }: PageProps<"/docs/[name]">) {
  const { name } = await params
  const item = getItem(name)
  const loadDemo = demos[name]
  if (!item || !loadDemo) notFound()

  const { default: Demo, props } = await loadDemo()
  const source = displaySource(await readFile(path.join(process.cwd(), item.files[0].path), "utf8"))
  const code = <CodeBlock code={source} />
  const group = item.categories?.[0] as Group | undefined
  const { previous, next } = getNeighbours(item.name)

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0 space-y-12">
        <header>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/docs/components" className="transition-colors hover:text-foreground">
              Components
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>{group ? GROUP_LABELS[group] : isBlock(item) ? "Sections" : "Components"}</span>
          </nav>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{item.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{item.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isDropIn(item) ? (
              <span className="inline-flex items-center rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-brand-foreground">
                Drop-in replacement
              </span>
            ) : null}
            <DependencyBadges dependencies={getDependencies(item)} />
          </div>
        </header>

        {isBlock(item) ? (
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
        </section>

        <section className="space-y-4">
          <SectionHeading id="props">Props</SectionHeading>
          <PropsTable props={props} />
        </section>

        <section className="space-y-4">
          <SectionHeading id="source">Source</SectionHeading>
          {code}
        </section>

        <PageNav previous={previous} next={next} />
      </article>

      <aside className="max-xl:hidden">
        <div className="sticky top-22 space-y-4">
          <OnThisPage links={SECTIONS} />
          <StarCard />
        </div>
      </aside>
    </div>
  )
}
