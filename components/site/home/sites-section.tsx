import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Crosshair, Maximize2, Monitor, MousePointer2, Smartphone, Tablet } from "lucide-react"
import { SitePieceCard } from "@/components/sites/site-piece-card"
import { Window } from "@/components/site/home/window"
import { hasPreview } from "@/lib/catalog"
import { getSites, posterOf, sitePieces, type SiteManifest } from "@/lib/sites"
import { cn } from "@/lib/utils"

/** How many of a site's pieces the panel beside the frame shows. */
const SHOWN_PIECES = 6

const SIZES = [Monitor, Tablet, Smartphone, Maximize2]

/**
 * A site as the viewer shows it, as a picture: its poster in a window with the viewer's toolbar, the inspector on
 * and its first piece outlined and named, and beside it the panel of pieces it is built from. Opens the viewer.
 */
function Showcase({ site }: { site: SiteManifest }) {
  const { listed, unlisted } = sitePieces(site)
  const poster = posterOf(site.slug)
  const host = new URL(site.url).host
  const outlined = listed[0]
  const pieces = listed.slice(0, SHOWN_PIECES).map((item) => ({
    name: item.name,
    title: item.title,
    description: item.description,
    hasPreview: hasPreview(item.name),
    unlisted: false,
  }))
  const more = site.pieces.length - pieces.length

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Link
        href={`/sites/${site.slug}`}
        aria-label={`Open ${site.title} in the viewer`}
        className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-span-8"
      >
        <Window title={host} className="transition-[border-color] group-hover:border-foreground/30">
          {/* the viewer's toolbar: the window sizes, Desktop chosen, and Inspect on */}
          <div aria-hidden className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="flex h-8 items-center gap-0.5 rounded-lg border bg-card/60 p-0.5">
              {SIZES.map((Icon, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground",
                    index === 0 && "bg-background text-foreground dark:bg-accent"
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              ))}
            </span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-2.5 text-xs font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
              <Crosshair className="size-3.5" />
              Inspect
            </span>
          </div>
          <div className="relative aspect-video overflow-hidden bg-background">
            {poster ? (
              <Image src={poster} alt={`${site.title}, as it opens`} width={1280} height={720} unoptimized className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-dots">
                <span className="font-mono text-xs text-muted-foreground/70">{site.title}</span>
              </div>
            )}
            {outlined ? (
              // the inspector at work: the piece under the pointer outlined, and named
              <div aria-hidden className="absolute inset-[5%] rounded-lg ring-2 ring-brand shadow-[0_0_0_200vmax_rgb(0_0_0/0.22)] transition-[inset] duration-500 group-hover:inset-[3.5%] motion-reduce:transition-none">
                <span className="absolute -top-3.5 left-3 rounded-md bg-brand px-2 py-1 text-[11px] leading-none font-semibold text-brand-foreground shadow-sm">
                  {outlined.title}
                </span>
                <MousePointer2 className="absolute top-[52%] left-[58%] size-5 fill-white text-black drop-shadow-md" />
              </div>
            ) : null}
          </div>
        </Window>
      </Link>

      <aside className="flex flex-col rounded-2xl border bg-card/50 p-1.5 lg:col-span-4">
        <div className="px-3 pt-3 pb-2">
          <h3 className="text-lg font-semibold tracking-[-0.015em]">{site.title}</h3>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{site.blurb}</p>
          <p className="mt-3 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
            Built from {listed.length} {listed.length === 1 ? "component" : "components"}
            {unlisted.length ? ` and ${unlisted.length} simple ${unlisted.length === 1 ? "piece" : "pieces"}` : ""}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-2 p-1.5">
          {pieces.map((piece, index) => (
            <li key={piece.name}>
              <SitePieceCard piece={piece} selected={index === 0} />
            </li>
          ))}
        </ul>
        <Link
          href={`/sites/${site.slug}`}
          className="group m-1.5 mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-[filter] hover:brightness-90"
        >
          Open {site.title}
          {more > 0 ? <span className="text-background/60">· {more} more pieces</span> : null}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </aside>
    </div>
  )
}

/** The sites after the first, as the cards the Sites page uses. */
function SiteCard({ site }: { site: SiteManifest }) {
  const { listed } = sitePieces(site)
  const poster = posterOf(site.slug)
  return (
    <Link
      href={`/sites/${site.slug}`}
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
      <div className="px-2.5 pt-3 pb-2">
        <h3 className="text-[14.5px] leading-tight font-semibold tracking-[-0.015em] transition-colors group-hover:text-brand-text">{site.title}</h3>
        <p className="mt-1.5 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">
          {listed.length} {listed.length === 1 ? "component" : "components"}
        </p>
      </div>
    </Link>
  )
}

/** Whole sites built from the library's pieces, framed and inspectable: what the Sites section is, and the first site. */
export function SitesSection() {
  const sites = getSites()
  if (sites.length === 0) return null
  const [first, ...rest] = sites

  return (
    <section aria-labelledby="sites-heading" className="border-y border-border/70 bg-card/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-brand-text">Sites</p>
            <h2 id="sites-heading" className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Sites built with mewo
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Whole pages made from the pieces in this library, framed here at a desktop, tablet or phone window so
              you can scroll them as a visitor would. Turn on <strong className="font-medium text-foreground">Inspect</strong>{" "}
              and the site outlines the piece under your pointer and names it: a click selects it in the panel beside
              the frame, a double-click opens its page with the install command. The simple pieces a site needs ship
              too, unlisted: each has a page and installs like any item, but stays out of the catalog. And every
              piece&apos;s page says which sites it is seen in.
            </p>
          </div>
          <Link
            href="/sites"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            All sites
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-12">
          <Showcase site={first} />
        </div>
        {rest.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((site) => (
              <li key={site.slug}>
                <SiteCard site={site} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
