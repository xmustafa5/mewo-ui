import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Marquee } from "@/registry/mewo/ui/marquee"

describe("Marquee", () => {
  it("renders children twice for a seamless loop, second copy aria-hidden", () => {
    render(<Marquee><span>logo</span></Marquee>)
    const copies = screen.getAllByText("logo")
    expect(copies).toHaveLength(2)
    expect(copies[0].parentElement).not.toHaveAttribute("aria-hidden")
    expect(copies[1].parentElement).toHaveAttribute("aria-hidden", "true")
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
