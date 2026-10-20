import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/site/docs-ui"
import { getItems, isBlock } from "@/lib/registry"
import { NAMESPACE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = { title: "Introduction" }

const codeClass = "overflow-x-auto rounded-xl border bg-card/60 p-4 font-mono text-sm"
const inlineCode = "rounded-md bg-accent px-1.5 py-0.5 font-mono text-[0.85em]"

export default function DocsIndexPage() {
  const registriesSnippet = JSON.stringify({ registries: { [NAMESPACE]: `${SITE_URL}/r/{name}.json` } }, null, 2)
  const items = getItems()
  const sections = items.filter(isBlock).length

  return (
    <article className="max-w-3xl space-y-12">
      <header>
        <p className="text-sm font-medium text-brand-text">Getting started</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Introduction</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          mewo is an open-source shadcn registry of animated React components and page sections. You install an item
          with the shadcn CLI and its source code is copied into your project. You own it from then on.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/docs/components"
            className="group inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-[filter] hover:brightness-110"
          >
            Browse {items.length - sections} components and {sections} sections
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <SectionHeading id="requirements">Requirements</SectionHeading>
        <p className="text-muted-foreground">
          A React project with shadcn initialised (<code className={inlineCode}>npx shadcn@latest init</code>) and
          Tailwind CSS v4. Components that use Motion or GSAP install those packages for you.
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="install">Install from the registry directory</SectionHeading>
        <p className="text-muted-foreground">
          mewo is listed in the shadcn registry directory as <code className={inlineCode}>{NAMESPACE}</code>, so this
          works with no configuration:
        </p>
        <pre className={codeClass}><code>{`npx shadcn@latest add ${NAMESPACE}/hero-aurora`}</code></pre>
      </section>

      <section className="space-y-4">
        <SectionHeading id="without-directory">Install without the directory</SectionHeading>
        <p className="text-muted-foreground">
          On a CLI that predates the directory, add the namespace to your{" "}
          <code className={inlineCode}>components.json</code>, then use the same command:
        </p>
        <pre className={codeClass}><code>{registriesSnippet}</code></pre>
        <p className="text-muted-foreground">
          Single components can also be installed straight from their URL, with no configuration at all:
        </p>
        <pre className={codeClass}><code>{`npx shadcn@latest add ${SITE_URL}/r/text-shimmer.json`}</code></pre>
        <p className="text-muted-foreground">
          Sections are the exception. They install other mewo components, which they list as{" "}
          <code className={inlineCode}>{NAMESPACE}/&lt;name&gt;</code>, and the CLI can only resolve that from a
          configured registry — so a section needs the <code className={inlineCode}>registries</code> entry above (or
          the registry directory listing) rather than the URL form.
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="what-an-install-does">What an install does</SectionHeading>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground marker:text-brand-text">
          <li>
            Copies the component into <code className={inlineCode}>components/ui/</code>, or a section into{" "}
            <code className={inlineCode}>components/</code>.
          </li>
          <li>Installs the npm packages that item needs — and only those.</li>
          <li>
            Adds any keyframes the item uses to your <code className={inlineCode}>globals.css</code>.
          </li>
          <li>For sections, installs the mewo components they are built from.</li>
        </ul>
      </section>
    </article>
  )
}
