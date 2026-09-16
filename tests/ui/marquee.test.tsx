import * as React from "react"
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
  // Only focusability may be taken away: `inert` would also remove the duplicates from hit-testing
  // and from text selection, leaving 3 of the 4 visible copies unclickable.
  it("takes the duplicated tracks out of the tab order without making them inert", () => {
    render(
      <Marquee data-testid="m">
        <a href="#x">logo</a>
        <button type="button">go</button>
      </Marquee>
    )
    const tracks = Array.from(screen.getByTestId("m").children)
    expect(tracks[0]).not.toHaveAttribute("aria-hidden")
    expect(tracks[0].querySelector("a")).not.toHaveAttribute("tabindex")
    expect(tracks[0].querySelector("button")).not.toHaveAttribute("tabindex")
    for (const track of tracks.slice(1)) {
      expect(track).toHaveAttribute("aria-hidden", "true")
      expect(track).not.toHaveAttribute("inert")
      expect(track.querySelector("a")).toHaveAttribute("tabindex", "-1")
      expect(track.querySelector("button")).toHaveAttribute("tabindex", "-1")
    }
  })

  // The duplicates are what the loop paints for most of its cycle, so they have to stay usable:
  // a pointer event over one must reach the element under the pointer, not a non-inert ancestor.
  // jsdom has no hit-testing, so this asserts the two attributes that decide it in a browser.
  it("leaves duplicated content clickable and selectable", () => {
    render(<Marquee data-testid="m"><a href="#x">logo</a></Marquee>)
    const root = screen.getByTestId("m")
    for (const track of Array.from(root.children)) {
      expect(track).not.toHaveAttribute("inert")
      expect(track.className).not.toContain("pointer-events-none")
      expect(track.className).not.toContain("select-none")
    }
  })

  // The duplicates are neutralised through a ref on each track, so the root's ref stays the
  // consumer's: a component that took the root ref for itself would silently stop neutralising.
  it("keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Marquee ref={ref} data-testid="m"><a href="#x">logo</a></Marquee>)
    expect(ref.current).toBe(screen.getByTestId("m"))
    const tracks = Array.from(screen.getByTestId("m").children)
    for (const track of tracks.slice(1)) expect(track.querySelector("a")).toHaveAttribute("tabindex", "-1")
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
