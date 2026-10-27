import { existsSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { getItem, isUnlisted } from "@/lib/registry"
import { frameSrc, getSiteFiles, getSites, posterOf, siteOrigin, sitePieces } from "@/lib/sites"

describe("content/sites", () => {
  const sites = getSites()

  it("has at least one site, one file per slug", () => {
    expect(sites.length).toBeGreaterThan(0)
    expect(getSiteFiles().sort()).toEqual(sites.map((site) => `${site.slug}.json`).sort())
    for (const site of sites) expect(site.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it("every site has a title, a blurb, an https address and a poster", () => {
    for (const site of sites) {
      expect(site.title.length, site.slug).toBeGreaterThan(0)
      expect(site.blurb.length, site.slug).toBeGreaterThan(0)
      expect(site.url, site.slug).toMatch(/^https:\/\//)
      expect(posterOf(site.slug), `public/sites/${site.slug}.webp`).toBe(`/sites/${site.slug}.webp`)
      expect(existsSync(path.join(process.cwd(), "public", "sites", `${site.slug}.webp`))).toBe(true)
    }
  })

  it("names only pieces the registry has, each once", () => {
    for (const site of sites) {
      expect(new Set(site.pieces).size, site.slug).toBe(site.pieces.length)
      for (const name of site.pieces) expect(getItem(name), `${site.slug} names ${name}`).toBeDefined()
      expect(sitePieces(site).missing).toEqual([])
    }
  })

  it("splits a site's pieces by their fate in the registry", () => {
    for (const site of sites) {
      const { listed, unlisted } = sitePieces(site)
      expect(listed.length + unlisted.length).toBe(site.pieces.length)
      for (const item of listed) expect(isUnlisted(item)).toBe(false)
      for (const item of unlisted) expect(isUnlisted(item)).toBe(true)
    }
  })

  it("frames an answering site with ?embed=1, and knows its origin", () => {
    const site = { slug: "x", title: "X", blurb: "", url: "https://x.example.com/", embed: true, pieces: [] }
    expect(frameSrc(site)).toBe("https://x.example.com/?embed=1")
    expect(frameSrc({ ...site, embed: false })).toBe("https://x.example.com/")
    expect(siteOrigin(site)).toBe("https://x.example.com")
  })
})
