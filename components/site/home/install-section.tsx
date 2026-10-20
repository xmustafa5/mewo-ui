import { readFile } from "node:fs/promises"
import path from "node:path"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CodeBlock } from "@/components/site/code-block"
import { Window } from "@/components/site/home/window"
import { displaySource } from "@/lib/source"

const FEATURED = "text-shimmer"

export async function InstallSection() {
  // A path the bundler can see is inside registry/, so it traces that folder, not the whole project.
  const source = displaySource(await readFile(path.join(process.cwd(), "registry", "mewo", "ui", `${FEATURED}.tsx`), "utf8"))

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 overflow-x-clip px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <h2 className="text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-5xl">
          One command, and the code is yours.
        </h2>
        <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
          The shadcn CLI copies the component&apos;s source into your Next.js, Vite or React Router project. No wrapper
          library, no runtime dependency on mewo, nothing to lock you in.
        </p>
        <Link
          href="/docs"
          className="group mt-8 inline-flex h-11 items-center gap-2 rounded-xl border bg-card/70 px-5 font-medium transition-colors hover:bg-card"
        >
          Installation guide
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-10 bg-[radial-gradient(50%_50%_at_60%_50%,color-mix(in_oklch,var(--brand)_25%,transparent),transparent_70%)]"
        />
        <div className="relative space-y-4">
          <Window title="Terminal" className="lg:mr-16">
            <div className="space-y-1 p-4 font-mono text-[13px] leading-6">
              <p>
                <span className="text-brand-text">$ </span>npx shadcn@latest add @mewo/{FEATURED}
              </p>
              <p className="text-muted-foreground">
                <span className="text-brand-text">✔</span> Checking registry.
              </p>
              <p className="text-muted-foreground">
                <span className="text-brand-text">✔</span> Created 1 file:
              </p>
              <p className="whitespace-pre text-muted-foreground">  - components/ui/{FEATURED}.tsx</p>
            </div>
          </Window>
          <Window title={`${FEATURED}.tsx`} className="lg:ml-16">
            <CodeBlock code={source} className="code-lines max-h-90 rounded-none border-0 bg-transparent" />
          </Window>
        </div>
      </div>
    </section>
  )
}
