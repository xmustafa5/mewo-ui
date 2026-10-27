import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { usePreviewClip } from "@/components/site/preview-media"
import { SitePieceCard } from "@/components/sites/site-piece-card"

function Probe({ name, hasPreview }: { name: string; hasPreview: boolean }) {
  const { start, stop, media } = usePreviewClip(name, hasPreview)
  return (
    <div data-testid="probe" onPointerEnter={start} onPointerLeave={stop}>
      {media}
    </div>
  )
}

describe("usePreviewClip", () => {
  it("shows both themes' posters and requests the clip only on the first hover", () => {
    const { container } = render(<Probe name="marquee" hasPreview />)
    const posters = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"))
    expect(posters).toEqual(["/previews/marquee-light.webp", "/previews/marquee-dark.webp"])
    expect(container.querySelector("video")).toBeNull()
    fireEvent.pointerEnter(screen.getByTestId("probe"))
    const video = container.querySelector("video")
    expect(video).not.toBeNull()
    expect([...video!.querySelectorAll("source")].map((s) => s.getAttribute("src"))).toEqual(["/previews/marquee-dark.webm", "/previews/marquee-dark.mp4"])
  })

  it("names the item in a placeholder when it has no poster", () => {
    const { container } = render(<Probe name="rich-text" hasPreview={false} />)
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("<RichText />")).toBeInTheDocument()
  })
})

describe("SitePieceCard", () => {
  const piece = { name: "glass-panel", title: "Glass Panel", description: "A panel.", hasPreview: true, unlisted: false }

  it("links to the piece's page with its name over the poster and nothing else", () => {
    render(<SitePieceCard piece={piece} selected={false} />)
    const link = screen.getByRole("link", { name: /Glass Panel/ })
    expect(link).toHaveAttribute("href", "/docs/glass-panel")
    expect(link).not.toHaveAttribute("aria-current")
    expect(screen.queryByText("A panel.")).toBeNull()
    expect(screen.queryByText("simple")).toBeNull()
  })

  it("marks a selected piece and tags a simple one", () => {
    render(<SitePieceCard piece={{ ...piece, name: "rich-text", title: "Rich Text", hasPreview: false, unlisted: true }} selected />)
    expect(screen.getByRole("link", { name: /Rich Text/ })).toHaveAttribute("aria-current", "true")
    expect(screen.getByText("Selected")).toBeInTheDocument()
    expect(screen.getByText("simple")).toBeInTheDocument()
  })

  it("with a goto handler the card is a button and a small arrow opens the page", () => {
    const onGoto = vi.fn()
    render(<SitePieceCard piece={piece} selected={false} onGoto={onGoto} />)
    fireEvent.click(screen.getByRole("button", { name: /Glass Panel/ }))
    expect(onGoto).toHaveBeenCalledWith("glass-panel")
    expect(screen.getByRole("link", { name: "Open Glass Panel" })).toHaveAttribute("href", "/docs/glass-panel")
  })
})
