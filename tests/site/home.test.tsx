import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CatalogEntry } from "@/components/site/catalog/catalog-filter"
import { getCatalogEntries } from "@/lib/catalog"
import { getItems } from "@/lib/registry"
import { getSites, sitePieces } from "@/lib/sites"
import { DEFAULT_BACKGROUND } from "@/components/studio/catalog"

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }))
// the hero's code window is highlighted on the server; here it is the code itself
vi.mock("@/components/site/code-block", () => ({ CodeBlock: ({ code }: { code: string }) => <pre>{code}</pre> }))

import { CustomizeDemo } from "@/components/site/home/customize-demo"
import { Hero, LATEST } from "@/components/site/home/hero"
import { Latest, latestEntries } from "@/components/site/home/latest"
import { PauseAway } from "@/components/site/home/pause-away"
import { PixelField } from "@/components/site/home/pixel-field"
import { SitesSection } from "@/components/site/home/sites-section"
import { StudioSection } from "@/components/site/home/studio-section"
import { TerminalDemo } from "@/components/site/home/terminal-demo"
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

  it("shows one background on the studio's stage as a picture that opens the studio on it", () => {
    const { container } = render(<StudioSection />)
    // the studio's default background on its Silk preset: the catalog's posters, nothing running
    const example = screen.getByRole("link", { name: /open pattern waves in the studio/i })
    expect(example).toHaveAttribute("href", `/studio?bg=${DEFAULT_BACKGROUND}&preset=silk`)
    expect(example.querySelectorAll(`img[src*="/previews/${DEFAULT_BACKGROUND}-"]`)).toHaveLength(2)
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("video")).toBeNull()
    // the panel drawn beside it: the presets with Silk chosen, three controls at the preset's values
    expect(example).toHaveTextContent("Silk")
    expect(example).toHaveTextContent("Spacing")
    expect(example).toHaveTextContent("Depth")
    expect(example).toHaveTextContent("Speed")
    expect(screen.queryByRole("button")).toBeNull()
  })
})

/** An IntersectionObserver whose callback a test fires itself, to put a block on or off screen. */
class ObserverStub {
  static last: ObserverStub | null = null
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  constructor(public callback: IntersectionObserverCallback) {
    ObserverStub.last = this
  }
  see(isIntersecting: boolean) {
    act(() => this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver))
  }
}

describe("PixelField", () => {
  it("draws every cell once and animates the pulsing cells' layers, never a cell itself", () => {
    const { container } = render(<PixelField />)
    const layers = [...container.querySelectorAll("svg")]
    expect(container.querySelectorAll("rect")).toHaveLength(30 * 16)
    expect(container.querySelector("rect[class*=animate]")).toBeNull()
    const pulsing = layers.filter((svg) => svg.getAttribute("class")?.includes("mewo-pixel-pulse"))
    expect(pulsing.length).toBeGreaterThan(1)
    expect(pulsing).toHaveLength(layers.length - 1)
    expect(new Set(pulsing.map((svg) => svg.style.animationDelay)).size).toBe(pulsing.length)
    for (const svg of pulsing) expect(svg.querySelectorAll("rect").length).toBeGreaterThan(0)
  })
})

describe("PauseAway", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", ObserverStub))
  afterEach(() => vi.unstubAllGlobals())

  it("marks the block away while it is not near the viewport", () => {
    const { container } = render(<PauseAway margin="50%">content</PauseAway>)
    const block = container.firstElementChild as HTMLElement
    expect(block).toHaveTextContent("content")
    expect(block).not.toHaveAttribute("data-away")
    ObserverStub.last!.see(false)
    expect(block).toHaveAttribute("data-away")
    ObserverStub.last!.see(true)
    expect(block).not.toHaveAttribute("data-away")
  })
})

describe("TerminalDemo", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ObserverStub)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
  const typed = () => (screen.getByRole("img").textContent ?? "").length

  it("types only while it can be seen", async () => {
    render(<TerminalDemo runs={[{ name: "text-shimmer", dependencies: [] }]} />)
    await act(() => vi.advanceTimersByTimeAsync(700))
    const seen = typed()
    expect(seen).toBeGreaterThan(4)
    ObserverStub.last!.see(false)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    const away = typed()
    expect(away - seen).toBeLessThanOrEqual(1)
    ObserverStub.last!.see(true)
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(typed()).toBeGreaterThan(away + 3)
  })
})
