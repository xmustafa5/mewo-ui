import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GitHubIcon } from "@/components/site/icons"
import { MewoCat } from "@/components/site/mewo-cat"
import { getItems } from "@/lib/registry"
import { GITHUB_URL } from "@/lib/site"

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/70">
      <div aria-hidden className="absolute inset-0 bg-pixel-grid mask-[radial-gradient(ellipse_at_50%_40%,black,transparent_70%)]" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(50%_70%_at_50%_100%,color-mix(in_oklch,var(--brand)_35%,transparent),transparent_75%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <MewoCat className="h-36 w-auto sm:h-48" />
        <h2 className="mt-12 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl">
          Make your interface move.
        </h2>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          {getItems().length} components and sections today, with more on the way. Free, open source and MIT licensed.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/components"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_30px_-8px_var(--brand)] transition-[filter] hover:brightness-110"
          >
            Browse components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl border bg-card/70 px-5 font-medium backdrop-blur transition-colors hover:bg-card"
          >
            <GitHubIcon className="size-4" />
            Star on GitHub
          </a>
        </div>
        <p className="mt-8 text-xs text-muted-foreground/80">The cat is watching your cursor.</p>
      </div>
    </section>
  )
}
