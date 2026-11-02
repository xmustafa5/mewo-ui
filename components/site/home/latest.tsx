import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CatalogEntry } from "@/components/site/catalog/catalog-filter"
import { PreviewCard } from "@/components/site/catalog/preview-card"
import { getCatalogEntries } from "@/lib/catalog"

/** How many of the newest items the home page shows: two rows of four. */
const COUNT = 8

/** The newest items first; items added on the same day keep their catalog order. */
export function latestEntries(entries: CatalogEntry[], count = COUNT): CatalogEntry[] {
  return [...entries].sort((a, b) => b.added.localeCompare(a.added)).slice(0, count)
}

/**
 * The latest release, as catalog cards: the poster of each piece, and its clip while the card is hovered.
 * Read from the registry, so a new item appears here the day it is added.
 */
export function Latest() {
  const entries = getCatalogEntries()
  const latest = latestEntries(entries)

  return (
    <section aria-labelledby="latest-heading" className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-text">Latest release</p>
          <h2 id="latest-heading" className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            New in the catalog
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The newest pieces, each filmed from its own demo. Hover a card to see it move; open it for the live
            preview, its Customize panel and the install command.
          </p>
        </div>
        <Link
          href="/docs/components"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          All {entries.length} components
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((entry) => (
          <li key={entry.name}>
            <PreviewCard entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  )
}
