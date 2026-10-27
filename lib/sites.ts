import fs from "node:fs"
import path from "node:path"
import { getItem, isUnlisted, type RegistryItem } from "@/lib/registry"

/**
 * A site built with mewo pieces, described by `content/sites/<slug>.json`. Which of its pieces are in the catalog
 * and which are unlisted is read from the registry, never written here.
 */
export type SiteManifest = {
  slug: string
  title: string
  blurb: string
  /** Where the site lives. It is framed from here. */
  url: string
  /** True when the site answers the viewer (the inspector, the handshake); it is then framed with `?embed=1`. */
  embed?: boolean
  /** The `source` the site's messages carry, when it is not the slug. */
  source?: string
  /** The registry names of the pieces the site is built from, in the order to show them. */
  pieces: string[]
}

/** Server only: reads `content/sites` and `public/sites` at build time. */
const SITES = path.join(/* turbopackIgnore: true */ process.cwd(), "content", "sites")
const POSTERS = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "sites")

export function getSites(): SiteManifest[] {
  if (!fs.existsSync(SITES)) return []
  return fs
    .readdirSync(SITES)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(SITES, file), "utf8")) as SiteManifest)
}

export const getSiteFiles = () => (fs.existsSync(SITES) ? fs.readdirSync(SITES).filter((file) => file.endsWith(".json")) : [])

export const getSite = (slug: string) => getSites().find((site) => site.slug === slug)

/** The site's pieces split by their fate in the registry; a name the registry does not have is reported, not shown. */
export function sitePieces(site: SiteManifest): { listed: RegistryItem[]; unlisted: RegistryItem[]; missing: string[] } {
  const listed: RegistryItem[] = []
  const unlisted: RegistryItem[] = []
  const missing: string[] = []
  for (const name of site.pieces) {
    const item = getItem(name)
    if (!item) missing.push(name)
    else if (isUnlisted(item)) unlisted.push(item)
    else listed.push(item)
  }
  return { listed, unlisted, missing }
}

/** The sites a piece appears in, for the "Seen in" row on its page. */
export const sitesWith = (name: string) => getSites().filter((site) => site.pieces.includes(name))

/** The address the viewer frames: with `?embed=1` when the site answers the viewer. */
export const frameSrc = (site: SiteManifest) => (site.embed ? `${site.url.replace(/\/$/, "")}/?embed=1` : site.url)

export const siteOrigin = (site: SiteManifest) => new URL(site.url).origin

/** The site's poster, `public/sites/<slug>.webp`, when one has been made. */
export const posterOf = (slug: string) => (fs.existsSync(path.join(POSTERS, `${slug}.webp`)) ? `/sites/${slug}.webp` : null)
