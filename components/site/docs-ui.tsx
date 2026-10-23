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

/** The rail's surface, the same frosted panel as the sidebar's, after React Bits' Pro and Sponsors cards. */
export const RAIL_CARD =
  "overflow-hidden rounded-2xl border bg-card/80 shadow-[0_14px_40px_rgb(24_24_27/0.08)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300"

export function OnThisPage({ links, className }: { links: { id: string; label: string }[]; className?: string }) {
  return (
    <nav aria-label="On this page" className={`${RAIL_CARD} px-5 pt-[18px] pb-4 text-[13px] ${className ?? ""}`}>
      <p className="mb-3 text-sm font-semibold tracking-[-0.03em] text-muted-foreground/65">On this page</p>
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

/** The rail's second card, in the shape of React Bits' Sponsors card: the cat, and a nudge towards the repo. */
export function StarCard() {
  return (
    <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={`group flex flex-col ${RAIL_CARD} hover:border-foreground/20`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-[18px] pb-1">
        <span className="text-base font-semibold tracking-[-0.02em]">Open source</span>
        <span className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/80">MIT licensed</span>
      </div>
      <div className="flex flex-col gap-2 px-5 pt-3 pb-1.5">
        <div className="relative flex h-24 items-end justify-center overflow-hidden rounded-[10px] bg-brand">
          <div aria-hidden className="absolute inset-0 bg-pixel-grid opacity-40 [--foreground:white]" />
          <MewoMark eyes="var(--brand)" className="relative h-16 w-auto translate-y-0.5 text-white" />
        </div>
        <p className="text-[11.5px] leading-[1.55] text-muted-foreground">
          Every component is yours to copy and change. A star helps other people find mewo.
        </p>
      </div>
      <span className="mt-0.5 flex items-center justify-between gap-3 px-5 pt-2.5 pb-4 text-xs font-semibold text-brand-text transition-colors group-hover:text-foreground">
        <span className="flex items-center gap-2">
          <GitHubIcon className="size-3.5" />
          Star on GitHub
        </span>
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </a>
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
