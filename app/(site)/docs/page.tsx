import type { Metadata } from "next"
import { NAMESPACE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = { title: "Introduction" }

const codeClass = "overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-sm"

export default function DocsIndexPage() {
  const registriesSnippet = JSON.stringify({ registries: { [NAMESPACE]: `${SITE_URL}/r/{name}.json` } }, null, 2)

  return (
    <article className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          mewo is an open-source shadcn registry of animated React components and page sections. You install an item with the shadcn CLI and its source code is copied into your project. You own it from then on.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Requirements</h2>
        <p>A React project with shadcn initialised (<code className="font-mono text-sm">npx shadcn@latest init</code>) and Tailwind CSS v4. Components that use Motion or GSAP install those packages for you.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Install from the registry directory</h2>
        <p>Once mewo is listed in the shadcn registry directory this works with no configuration:</p>
        <pre className={codeClass}><code>{`npx shadcn@latest add ${NAMESPACE}/hero-aurora`}</code></pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Install without the directory</h2>
        <p>Add the namespace to your <code className="font-mono text-sm">components.json</code>, then use the same command:</p>
        <pre className={codeClass}><code>{registriesSnippet}</code></pre>
        <p>Or point the CLI at an item URL directly:</p>
        <pre className={codeClass}><code>{`npx shadcn@latest add ${SITE_URL}/r/hero-aurora.json`}</code></pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What an install does</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Copies the component into <code className="font-mono text-sm">components/ui/</code>, or a section into <code className="font-mono text-sm">components/</code>.</li>
          <li>Installs the npm packages that item needs — and only those.</li>
          <li>Adds any keyframes the item uses to your <code className="font-mono text-sm">globals.css</code>.</li>
          <li>For sections, installs the mewo components they are built from.</li>
        </ul>
      </section>
    </article>
  )
}
