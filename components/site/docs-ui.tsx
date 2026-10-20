import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { GitHubIcon } from "@/components/site/icons"
import { MewoMark, PixelSteps } from "@/components/site/mewo-mark"
import type { RegistryItem } from "@/lib/registry"
import { GITHUB_URL } from "@/lib/site"

export function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group flex scroll-mt-24 items-center gap-2.5 text-xl font-semibold tracking-tight">
      <PixelSteps className="size-3" />
      <a href={`#${id}`} className="hover:underline hover:decoration-border hover:underline-offset-4">
        {children}
      </a>
    </h2>
  )
}

export function OnThisPage({ links }: { links: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="rounded-2xl border bg-card/50 p-4 text-sm">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">On this page</p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <a href={`#${link.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The rail's call to action: the cat, and a nudge towards the repo. */
export function StarCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/50 p-1.5">
      <div className="relative flex h-36 items-end justify-center overflow-hidden rounded-xl bg-brand">
        <div aria-hidden className="absolute inset-0 bg-pixel-grid opacity-40 [--foreground:white]" />
        <MewoMark eyes="var(--brand)" className="relative h-24 w-auto translate-y-1 text-white" />
      </div>
      <div className="space-y-3 p-3">
        <p className="font-semibold tracking-tight">Free and open source.</p>
        <p className="text-sm text-muted-foreground">mewo is MIT licensed. A star on GitHub helps other people find it.</p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <GitHubIcon className="size-4" />
          Star on GitHub
        </a>
      </div>
    </div>
  )
}

export function PageNav({ previous, next }: { previous?: RegistryItem; next?: RegistryItem }) {
  const cardClass = "group flex flex-1 flex-col gap-1 rounded-2xl border bg-card/40 p-4 transition-colors hover:bg-card"
  return (
    <nav aria-label="Previous and next" className="flex flex-col gap-3 border-t pt-8 sm:flex-row">
      {previous ? (
        <Link href={`/docs/${previous.name}`} className={cardClass}>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Previous
          </span>
          <span className="font-medium">{previous.title}</span>
        </Link>
      ) : (
        <span className="flex-1 max-sm:hidden" />
      )}
      {next ? (
        <Link href={`/docs/${next.name}`} className={`${cardClass} items-end text-right`}>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="font-medium">{next.title}</span>
        </Link>
      ) : (
        <span className="flex-1 max-sm:hidden" />
      )}
    </nav>
  )
}
