import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CatalogEntry } from "@/components/site/catalog/catalog-filter"
import { getCatalogEntries } from "@/lib/catalog"
import { getItems } from "@/lib/registry"
import { getSites, sitePieces } from "@/lib/sites"
import { CATALOG, DEFAULT_BACKGROUND } from "@/components/studio/catalog"

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }))
// the hero's code window is highlighted on the server; here it is the code itself
vi.mock("@/components/site/code-block", () => ({ CodeBlock: ({ code }: { code: string }) => <pre>{code}</pre> }))

import { CustomizeDemo } from "@/components/site/home/customize-demo"
import { Hero, LATEST } from "@/components/site/home/hero"
import { Latest, latestEntries } from "@/components/site/home/latest"
import { SitesSection } from "@/components/site/home/sites-section"
import { StudioDemo } from "@/components/site/home/studio-demo"
import { StudioSection } from "@/components/site/home/studio-section"
import { WhatsInside } from "@/components/site/home/whats-inside"

const entry = (name: string, added: string): CatalogEntry => ({
  name,
  title: name,
  description: "",
  group: "text",
  groupLabel: "Text",
  added,
  isNew: false,
  hasPreview: false,
})

describe("Hero", () => {
  it("names the latest item in its pill, counts the catalog and leads to it", () => {
    render(<Hero />)
    expect(screen.getByRole("link", { name: new RegExp(LATEST.label) })).toHaveAttribute("href", `/docs/${LATEST.name}`)
    expect(screen.getAllByRole("link", { name: /browse components/i })[0]).toHaveAttribute("href", "/docs/components")
    expect(screen.getByText(new RegExp(`^${getItems().length} animated components and sections`))).toBeInTheDocument()
  })
})

describe("Latest", () => {
  it("puts the newest items first and keeps the catalog order among a day's additions", () => {
    const entries = [entry("a", "2026-10-01"), entry("b", "2026-10-28"), entry("c", "2026-10-21"), entry("d", "2026-10-28")]
    expect(latestEntries(entries, 3, {}).map((item) => item.name)).toEqual(["b", "d", "c"])
  })

  it("swaps a newest item for another, in its place, unless the other is among the newest already", () => {
    const entries = [entry("a", "2026-10-01"), entry("b", "2026-10-28"), entry("c", "2026-10-21"), entry("d", "2026-10-28")]
    expect(latestEntries(entries, 3, { d: "a" }).map((item) => item.name)).toEqual(["b", "a", "c"])
    expect(latestEntries(entries, 3, { d: "b" }).map((item) => item.name)).toEqual(["b", "d", "c"])
    expect(latestEntries(entries, 3, { d: "nothing" }).map((item) => item.name)).toEqual(["b", "d", "c"])
  })

  it("gives Depth Image's card to Picture Orbit, since Depth Image runs live in the gallery", () => {
    const names = latestEntries(getCatalogEntries()).map((item) => item.name)
    expect(names).toContain("picture-orbit")
    expect(names).not.toContain("depth-image")
  })

  it("shows the newest cards from the registry, each linking to its page", () => {
    render(<Latest />)
    const list = screen.getByRole("heading", { name: "New in the catalog" }).closest("section")!
    const cards = within(list).getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/docs/") && link.getAttribute("href") !== "/docs/components")
    expect(cards).toHaveLength(8)
    const newest = latestEntries(getCatalogEntries())[0]
    expect(cards[0]).toHaveAttribute("href", `/docs/${newest.name}`)
    expect(within(list).getByRole("link", { name: new RegExp(`All ${getCatalogEntries().length} components`) })).toHaveAttribute("href", "/docs/components")
  })
})

describe("WhatsInside", () => {
  it("counts the catalog and opens the studio", () => {
    render(<WhatsInside />)
    expect(screen.getByRole("heading", { name: `${getItems().length} components and sections` })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /open the studio/i })).toHaveAttribute("href", "/studio")
    expect(screen.getByRole("link", { name: /browse the catalog/i })).toHaveAttribute("href", "/docs/components")
  })
})

describe("SitesSection", () => {
  it("explains the inspector and shows the first site with its pieces", () => {
    render(<SitesSection />)
    const [site] = getSites()
    const { listed } = sitePieces(site)
    expect(screen.getByRole("heading", { name: "Sites built with mewo" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: `Open ${site.title} in the viewer` })).toHaveAttribute("href", `/sites/${site.slug}`)
    for (const link of screen.getAllByRole("link", { name: new RegExp(`^Open ${site.title}`) })) expect(link).toHaveAttribute("href", `/sites/${site.slug}`)
    expect(screen.getByRole("link", { name: /all sites/i })).toHaveAttribute("href", "/sites")
    // the piece the inspector outlines is the first listed one, and its card is the selected one
    expect(screen.getAllByText(listed[0].title).length).toBeGreaterThan(0)
    expect(document.getElementById(`site-piece-${listed[0].name}`)).toHaveAttribute("aria-current", "true")
    expect(document.getElementById(`site-piece-${listed[0].name}`)).toHaveAttribute("href", `/docs/${listed[0].name}`)
  })
})

describe("CustomizeDemo", () => {
  it("writes the usage from the values, and resets", () => {
    render(<CustomizeDemo />)
    const usage = () => screen.getByText("Usage").closest("div")!.parentElement!.querySelector("pre")!.textContent
    expect(usage()).toContain("<TextShimmer>Shimmering text</TextShimmer>")
    expect(screen.queryByText("With your settings")).toBeNull()

    fireEvent.change(screen.getByRole("textbox", { name: "Text" }), { target: { value: "Hello" } })
    expect(usage()).toContain("<TextShimmer>Hello</TextShimmer>")
    expect(screen.getByText("With your settings")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(usage()).toContain("<TextShimmer>Shimmering text</TextShimmer>")
    expect(screen.queryByText("With your settings")).toBeNull()
  })
})

describe("StudioSection", () => {
  it("explains the studio and opens it", () => {
    render(<StudioSection />)
    expect(screen.getByRole("heading", { name: /tune a background live/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /open the studio/i })).toHaveAttribute("href", "/studio")
  })
})

describe("StudioDemo", () => {
  it("lists every studio background, starts on the studio's default, and carries the choice into the studio", () => {
    render(<StudioDemo />)
    const rail = within(screen.getByRole("navigation", { name: "Backgrounds" }))
    expect(rail.getAllByRole("button")).toHaveLength(CATALOG.length)
    const start = CATALOG.find((entry) => entry.id === DEFAULT_BACKGROUND)!
    expect(rail.getByRole("button", { name: start.label })).toHaveAttribute("aria-current", "true")
    expect(screen.getByRole("link", { name: /open in studio/i })).toHaveAttribute("href", `/studio?bg=${DEFAULT_BACKGROUND}`)

    // another background, then one of its presets
    const other = CATALOG.find((entry) => entry.id !== DEFAULT_BACKGROUND && entry.presets?.length)!
    fireEvent.click(rail.getByRole("button", { name: other.label }))
    expect(screen.getByRole("heading", { name: other.label })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /open in studio/i })).toHaveAttribute("href", `/studio?bg=${other.id}`)
    const preset = other.presets![0]
    fireEvent.click(screen.getByRole("button", { name: preset.label }))
    expect(screen.getByRole("button", { name: preset.label })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("link", { name: /open in studio/i })).toHaveAttribute("href", `/studio?bg=${other.id}&preset=${preset.value}`)

    // reset drops the preset
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(screen.getByRole("link", { name: /open in studio/i })).toHaveAttribute("href", `/studio?bg=${other.id}`)
  })

  it("offers the sample content the studio does", () => {
    render(<StudioDemo />)
    const track = screen.getByRole("group", { name: "Sample content" })
    expect(within(track).getByRole("button", { name: "Landing page" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(track).getByRole("button", { name: "Card" }))
    expect(within(track).getByRole("button", { name: "Card" })).toHaveAttribute("aria-pressed", "true")
  })
})
