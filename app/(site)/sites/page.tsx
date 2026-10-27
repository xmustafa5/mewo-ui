import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getSites, posterOf, sitePieces } from "@/lib/sites"

export const metadata: Metadata = {
  title: "Sites",
  description: "Whole sites built with mewo pieces: scroll them here, and see which piece is which.",
}

export default function SitesPage() {
  const sites = getSites()
  return (
    <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-brand-text">Sites</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Sites built with mewo</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Whole pages made from the pieces in this library. Open one to scroll it here, and turn on Inspect to see which
          piece is which.
        </p>
      </header>

      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {sites.map((site) => {
          const { listed, unlisted } = sitePieces(site)
          const poster = posterOf(site.slug)
          return (
            <li key={site.slug}>
              <Link
                href={`/sites/${site.slug}`}
                data-slot="site-card"
                className="group block rounded-2xl bg-card/60 p-1.5 ring-1 ring-border transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-border/60">
                  {poster ? (
                    <Image src={poster} alt="" width={1280} height={720} unoptimized className="size-full object-cover" />
                  ) : (
                    <div aria-hidden className="grid size-full place-items-center bg-dots">
                      <span className="font-mono text-xs text-muted-foreground/70">{site.title}</span>
                    </div>
                  )}
                </div>
                <div className="px-3 pt-4 pb-3">
                  <h2 className="text-lg font-semibold tracking-[-0.015em] transition-colors group-hover:text-brand-text">{site.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{site.blurb}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                    {listed.length} {listed.length === 1 ? "component" : "components"}
                    {unlisted.length ? ` and ${unlisted.length} simple ${unlisted.length === 1 ? "piece" : "pieces"}` : ""}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
