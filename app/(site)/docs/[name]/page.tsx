import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { demos } from "@/components/demos"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentPreview } from "@/components/site/component-preview"
import { DependencyBadges } from "@/components/site/dependency-badges"
import { InstallCommand } from "@/components/site/install-command"
import { PropsTable } from "@/components/site/props-table"
import { getItem, getItems, isBlock } from "@/lib/registry"
import { displaySource } from "@/lib/source"

export function generateStaticParams() {
  return getItems().map((item) => ({ name: item.name }))
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
  const source = displaySource(await readFile(path.join(process.cwd(), item.files[0].path), "utf8"))
  const code = <CodeBlock code={source} />

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{isBlock(item) ? "Section" : "Component"}</p>
        <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
        <p className="text-lg text-muted-foreground">{item.description}</p>
        <DependencyBadges dependencies={item.dependencies} />
      </header>

      {isBlock(item) ? (
        <ComponentPreview code={code}>
          <Demo />
        </ComponentPreview>
      ) : (
        <ComponentPreview code={code}>
          <Demo />
        </ComponentPreview>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Install</h2>
        <InstallCommand name={item.name} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable props={props} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Source</h2>
        {code}
      </section>
    </article>
  )
}
