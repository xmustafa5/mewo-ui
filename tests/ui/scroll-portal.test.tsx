import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ScrollPortal, portalFrameScale } from "@/registry/mewo/ui/scroll-portal"

const scenes = [{ content: <p>one</p> }, { content: <p>two</p> }, { content: <p>three</p> }]
const frames = () => Array.from(screen.getByTestId("p").querySelectorAll<HTMLElement>('[data-slot="scroll-portal-frame"]'))

describe("portalFrameScale", () => {
  it("fills the stage at the camera and shrinks with distance", () => {
    expect(portalFrameScale(0, 0, 1000, 1000)).toBe(1)
    expect(portalFrameScale(1, 0, 1000, 1000)).toBe(0.5)
    expect(portalFrameScale(2, 0, 1000, 1000)).toBeCloseTo(1 / 3)
  })

  it("nests the next frame smaller for a shorter focal length or a deeper gap", () => {
    expect(portalFrameScale(1, 0, 500, 1000)).toBeCloseTo(1 / 3)
    expect(portalFrameScale(1, 0, 1000, 2000)).toBeCloseTo(1 / 3)
  })

  // A frame the camera has reached or passed would divide by zero or flip negative.
  it("stays finite for a frame the camera has passed", () => {
    expect(portalFrameScale(0, 1, 1000, 1000)).toBe(40)
    expect(portalFrameScale(0, 5, 1000, 1000)).toBe(40)
  })
})

describe("ScrollPortal", () => {
  it("renders a frame for every scene with its content", () => {
    render(<ScrollPortal scenes={scenes} data-testid="p" />)
    expect(screen.getByTestId("p")).toHaveAttribute("data-slot", "scroll-portal")
    expect(frames()).toHaveLength(3)
    for (const text of ["one", "two", "three"]) expect(screen.getByText(text)).toBeInTheDocument()
  })

  it("rests with each frame nested inside the one before it", () => {
    render(<ScrollPortal scenes={scenes} mobileBreakpoint={0} data-testid="p" />)
    const [first, second] = frames()
    expect(first.style.transform).toContain("scale(1)")
    expect(second.style.transform).toContain("scale(0.5)")
  })

  it("sizes the scroll runway to one handoff per scene after the first", () => {
    render(<ScrollPortal scenes={scenes} scrollLength={1.5} data-testid="p" />)
    expect(screen.getByTestId("p").getAttribute("style")).toContain("--mewo-length: 4")
  })

  it("reports the scene the camera opens on", () => {
    const onSceneChange = vi.fn()
    render(<ScrollPortal scenes={scenes} onSceneChange={onSceneChange} />)
    expect(onSceneChange).toHaveBeenCalledTimes(1)
    expect(onSceneChange).toHaveBeenCalledWith(0)
  })

  it("renders nothing to pin when there are no scenes", () => {
    render(<ScrollPortal data-testid="p" />)
    expect(frames()).toHaveLength(0)
    expect(screen.getByTestId("p").getAttribute("style")).toContain("--mewo-length: 1")
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLElement>()
    render(<ScrollPortal ref={ref} scenes={scenes} className="bg-muted" data-testid="p" />)
    expect(screen.getByTestId("p")).toHaveClass("bg-muted")
    expect(ref.current).toBe(screen.getByTestId("p"))
  })
})
