import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GitHubIcon } from "@/components/site/icons"
import { MewoMark } from "@/components/site/mewo-mark"
import { Search } from "@/components/site/search"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { getSearchEntries } from "@/lib/navigation"
import { GITHUB_URL, SITE_NAME } from "@/lib/site"

const navLinkClass =
  "rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg pr-1" aria-label={`${SITE_NAME} home`}>
          {/* Ink, like React Bits' header mark: white on dark, near-black on light. */}
          <MewoMark eyes="var(--background)" className="h-5.5 w-auto text-foreground" />
          <span className="text-[17px] font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        <span aria-hidden className="text-lg font-light text-muted-foreground/50 max-md:hidden">
          /
        </span>
        <nav aria-label="Main" className="flex items-center gap-0.5 max-md:hidden">
          <Link href="/docs" className={navLinkClass}>
            Docs
          </Link>
          <Link href="/docs/components" className={navLinkClass}>
            Components
          </Link>
          <Link href="/docs/names-duel" className={navLinkClass}>
            Sections
          </Link>
          <Link href="/sites" className={navLinkClass}>
            Sites
          </Link>
          <Link href="/studio" className={navLinkClass}>
            Studio
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Search entries={getSearchEntries()} />
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card/60 px-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <GitHubIcon className="size-4" />
            <span className="max-sm:sr-only">GitHub</span>
          </a>
          <Link
            href="/docs/components"
            className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-[filter] hover:brightness-110 max-lg:hidden"
          >
            Browse components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}
