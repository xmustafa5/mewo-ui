import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { parseMessage, pieceSpecs } from "@/components/sites/protocol"
import { SiteViewer } from "@/components/sites/site-viewer"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

const site = {
  slug: "rivers",
  title: "Rivers",
  blurb: "A story.",
  url: "https://rivers.example.com",
  frame: "https://rivers.example.com/?embed=1",
  origin: "https://rivers.example.com",
  embed: true,
  source: "rivers",
  poster: null,
}
const pieces = [
  { name: "glass-panel", title: "Glass Panel", description: "A panel.", hasPreview: false, unlisted: false },
  { name: "zoom-picture", title: "Zoom Picture", description: "A picture.", hasPreview: false, unlisted: false },
  { name: "rich-text", title: "Rich Text", description: "Text.", hasPreview: false, unlisted: true },
]

const message = (data: unknown, origin = site.origin) => {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin }))
  })
}

describe("the protocol", () => {
  it("tags simple pieces and labels every piece by its title", () => {
    expect(pieceSpecs(pieces)).toEqual([
      { name: "glass-panel", label: "Glass Panel" },
      { name: "zoom-picture", label: "Zoom Picture" },
      { name: "rich-text", label: "Rich Text", tag: "simple" },
    ])
  })

  it("reads the site's messages and nothing else", () => {
    const from = (data: unknown, origin = site.origin) => parseMessage({ origin, data }, site.origin, site.slug)
    expect(from({ source: "rivers", type: "ready", locale: "en" })).toEqual({ type: "ready", locale: "en" })
    expect(from({ source: "rivers", type: "select", name: "glass-panel" })).toEqual({ type: "select", name: "glass-panel" })
    expect(from({ source: "rivers", type: "escape" })).toEqual({ type: "escape" })
    expect(from({ source: "other", type: "ready" })).toBeNull()
    expect(from({ source: "rivers", type: "ready" }, "https://evil.example.com")).toBeNull()
    expect(from({ source: "rivers", type: "select" })).toBeNull()
    expect(from("ready")).toBeNull()
  })
})

describe("SiteViewer", () => {
  it("frames the site and lists its pieces in two groups with the link out", () => {
    render(<SiteViewer site={site} pieces={pieces} />)
    expect(screen.getByTitle("Rivers")).toHaveAttribute("src", site.frame)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rivers")
    expect(screen.getByText(/2 components and 1 simple piece/)).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Components" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Simple pieces of this site" })).toHaveTextContent("Rich Text")
    expect(screen.getByRole("link", { name: /Open site/ })).toHaveAttribute("href", site.url)
    expect(screen.getByRole("button", { name: /Glass Panel/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open Glass Panel" })).toHaveAttribute("href", "/docs/glass-panel")
  })

  it("has an Inspect toggle that reads its state", () => {
    render(<SiteViewer site={site} pieces={pieces} />)
    const toggle = screen.getByRole("button", { name: "Inspect" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    fireEvent.keyDown(window, { key: "Escape" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
  })

  it("marks the piece the site selected, from the site's origin only", () => {
    render(<SiteViewer site={site} pieces={pieces} />)
    message({ source: "rivers", type: "select", name: "zoom-picture" }, "https://evil.example.com")
    expect(document.getElementById("site-piece-zoom-picture")).not.toHaveAttribute("aria-current")
    message({ source: "rivers", type: "select", name: "zoom-picture" })
    expect(document.getElementById("site-piece-zoom-picture")).toHaveAttribute("aria-current", "true")
    expect(screen.getByText("Selected Zoom Picture")).toBeInTheDocument()
  })

  it("leaves the inspector when the site says escape", () => {
    render(<SiteViewer site={site} pieces={pieces} />)
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }))
    message({ source: "rivers", type: "escape" })
    expect(screen.getByRole("button", { name: "Inspect" })).toHaveAttribute("aria-pressed", "false")
  })

  it("hides the list on request, so the frame takes the whole width", () => {
    render(<SiteViewer site={site} pieces={pieces} />)
    const list = screen.getByRole("button", { name: "List" })
    expect(list).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("region", { name: "Components" })).toBeInTheDocument()
    fireEvent.click(list)
    expect(list).toHaveAttribute("aria-pressed", "false")
    expect(screen.queryByRole("region", { name: "Components" })).toBeNull()
  })

  it("frames the site at a fixed desktop window by default, and at the preset picked, remembered", () => {
    window.localStorage.removeItem("mewo:sites:size")
    const { unmount } = render(<SiteViewer site={site} pieces={pieces} />)
    const group = screen.getByRole("group", { name: "Frame size" })
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByTitle("Rivers")).toHaveStyle({ width: "1440px", height: "900px" })
    expect(screen.getByText(/1440 × 900/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Phone" }))
    expect(screen.getByTitle("Rivers")).toHaveStyle({ width: "375px", height: "812px" })
    expect(group).toContainElement(screen.getByRole("button", { name: "Phone" }))
    fireEvent.click(screen.getByRole("button", { name: "Fit" }))
    expect(screen.getByTitle("Rivers").style.width).toBe("")
    expect(screen.getByText(/fits the window/)).toBeInTheDocument()
    unmount()
    // the choice holds for the next visit
    render(<SiteViewer site={site} pieces={pieces} />)
    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "true")
    window.localStorage.removeItem("mewo:sites:size")
  })

  it("has no Inspect toggle for a site that does not answer, and its cards open the page", () => {
    render(<SiteViewer site={{ ...site, embed: false }} pieces={pieces} />)
    expect(screen.queryByRole("button", { name: "Inspect" })).toBeNull()
    expect(screen.getByText("The pieces this site is built from.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Glass Panel/ })).toHaveAttribute("href", "/docs/glass-panel")
  })

  it("a card takes the framed site to the piece and marks it; a piece in the address is shown once the site is up", () => {
    window.history.replaceState(null, "", "/sites/rivers?piece=zoom-picture")
    render(<SiteViewer site={site} pieces={pieces} />)
    fireEvent.click(screen.getByRole("button", { name: /Glass Panel/ }))
    expect(document.getElementById("site-piece-glass-panel")).toHaveAttribute("aria-current", "true")
    message({ source: "rivers", type: "ready" })
    expect(document.getElementById("site-piece-zoom-picture")).toHaveAttribute("aria-current", "true")
    window.history.replaceState(null, "", "/")
  })
})
