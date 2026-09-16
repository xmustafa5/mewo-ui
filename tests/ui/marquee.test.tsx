import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Marquee } from "@/registry/mewo/ui/marquee"

describe("Marquee", () => {
  it("repeats children enough times to cover the container, first copy only in the a11y tree", () => {
    render(<Marquee><span>logo</span></Marquee>)
    const copies = screen.getAllByText("logo")
    expect(copies).toHaveLength(4)
    expect(copies[0].parentElement).not.toHaveAttribute("aria-hidden")
    for (const copy of copies.slice(1)) expect(copy.parentElement).toHaveAttribute("aria-hidden", "true")
  })

  it("takes a repeat count", () => {
    render(<Marquee repeat={2}><span>logo</span></Marquee>)
    expect(screen.getAllByText("logo")).toHaveLength(2)
  })

  // aria-hidden hides a track from assistive tech but leaves its links and buttons tabbable,
  // so focus would land in a subtree that announces nothing (WCAG 4.1.2, axe aria-hidden-focus).
  it("makes every duplicated track inert so its focusable children leave the tab order", () => {
    render(<Marquee data-testid="m"><a href="#x">logo</a></Marquee>)
    const tracks = Array.from(screen.getByTestId("m").children)
    expect(tracks[0]).not.toHaveAttribute("inert")
    for (const track of tracks.slice(1)) {
      expect(track).toHaveAttribute("inert")
      expect(track).toHaveAttribute("aria-hidden", "true")
    }
  })

  it("reverses direction and pauses on hover by default", () => {
    render(<Marquee direction="right" data-testid="m"><span>x</span></Marquee>)
    const track = screen.getByTestId("m").firstElementChild as HTMLElement
    expect(track.className).toContain("[animation-direction:reverse]")
    expect(track.className).toContain("group-hover:[animation-play-state:paused]")
  })

  it("can disable pause on hover", () => {
    render(<Marquee pauseOnHover={false} data-testid="m"><span>x</span></Marquee>)
    const track = screen.getByTestId("m").firstElementChild as HTMLElement
    expect(track.className).not.toContain("animation-play-state")
  })

  it("forwards className and exposes speed as a CSS variable", () => {
    render(<Marquee className="py-4" speed={12} data-testid="m"><span>x</span></Marquee>)
    const root = screen.getByTestId("m")
    expect(root).toHaveClass("py-4")
    expect(root.getAttribute("style")).toContain("--marquee-duration: 12s")
  })
})
