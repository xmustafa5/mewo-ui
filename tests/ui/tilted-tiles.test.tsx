import * as React from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TiltedTiles, columnOrder, fadeMask, planeTransform, stripTransform, tileCopies } from "@/registry/mewo/ui/tilted-tiles"

const images = ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg", "/e.jpg"]
const columns = () => Array.from(screen.getByTestId("t").querySelectorAll<HTMLElement>('[data-slot="tilted-tiles-column"]'))
const strips = () => Array.from(screen.getByTestId("t").querySelectorAll<HTMLElement>('[data-slot="tilted-tiles-strip"]'))
const layout = { columns: 16, columnGap: 8, tilesPerColumn: 5, tileAspect: 1, rowGap: 8, planeWidth: 280, planeHeight: 260 }

describe("fadeMask", () => {
  it("has nothing to mask without a fade", () => {
    expect(fadeMask(0, 0)).toBeUndefined()
  })

  it("eases the top fade in over its height and leaves the rest opaque", () => {
    const mask = fadeMask(22, 0)!
    expect(mask.startsWith("linear-gradient(to bottom, rgb(0 0 0 / 0) 0.000%, rgb(0 0 0 / 0.02) 3.366%")).toBe(true)
    expect(mask).toContain("rgb(0 0 0 / 0.3) 11.000%")
    expect(mask.endsWith("rgb(0 0 0 / 1) 22.000%, rgb(0 0 0 / 1) 100%)")).toBe(true)
  })

  it("mirrors the same stops for a bottom fade", () => {
    const mask = fadeMask(0, 10)!
    expect(mask.startsWith("linear-gradient(to bottom, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 1) 90.000%")).toBe(true)
    expect(mask).toContain("rgb(0 0 0 / 0.3) 95.000%")
    expect(mask.endsWith("rgb(0 0 0 / 0) 100.000%)")).toBe(true)
  })
})

describe("columnOrder", () => {
  it("keeps the given order in the first column", () => {
    expect(columnOrder(5, 0)).toEqual([0, 1, 2, 3, 4])
  })

  it("gives every other column its own fixed shuffle of the same images", () => {
    const second = columnOrder(10, 1)
    expect([...second].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(second).not.toEqual(columnOrder(10, 0))
    expect(second).not.toEqual(columnOrder(10, 2))
    expect(columnOrder(10, 1)).toEqual(second)
  })
})

describe("tileCopies", () => {
  it("starts with 3 copies before the root is measured", () => {
    expect(tileCopies(0, 0, layout)).toBe(3)
  })

  it("adds copies until one set can scroll out while the rest cover the column", () => {
    expect(tileCopies(1000, 600, layout)).toBe(3)
    // Narrow columns mean short sets, so a phone needs more of them.
    expect(tileCopies(375, 600, layout)).toBe(6)
    expect(tileCopies(375, 812, layout)).toBe(8)
  })

  it("keeps between 2 and 60 copies", () => {
    expect(tileCopies(1000, 600, { ...layout, planeHeight: 0, rowGap: 0 })).toBe(2)
    expect(tileCopies(1000, 1e6, layout)).toBe(60)
  })
})

describe("transforms", () => {
  it("centres the plane, tilts it, then shifts it", () => {
    expect(planeTransform(40, 16, -20, -40, 0, 0)).toBe("translate(-50%, -50%) rotateX(40.0000deg) rotateY(16.0000deg) rotate(-20deg) translate3d(-40px, 0px, 0px)")
  })

  it("moves a strip by one set and one gap over a full loop", () => {
    expect(stripTransform(0, 3, 8)).toBe("translate3d(0, calc(0.0000% - 0.000px), 0)")
    expect(stripTransform(1, 3, 8)).toBe("translate3d(0, calc(-33.3333% - 2.667px), 0)")
  })
})

describe("TiltedTiles", () => {
  const matchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMedia
    vi.restoreAllMocks()
  })

  it("renders the root with data-slot, the merged className and a column per column", () => {
    render(<TiltedTiles className="rounded-lg" data-testid="t" />)
    const root = screen.getByTestId("t")
    expect(root).toHaveAttribute("data-slot", "tilted-tiles")
    expect(root).toHaveClass("relative", "h-full", "w-full", "overflow-hidden", "rounded-lg")
    expect(columns()).toHaveLength(16)
    // 3 copies of 5 tiles until the root has been measured.
    for (const strip of strips()) expect(strip.children).toHaveLength(15)
  })

  it("takes the column and tile counts", () => {
    render(<TiltedTiles images={images} columns={4} tilesPerColumn={4} data-testid="t" />)
    expect(columns()).toHaveLength(4)
    for (const strip of strips()) expect(strip.children).toHaveLength(12)
  })

  it("staggers the columns in a repeating three-step pattern", () => {
    render(<TiltedTiles images={images} columns={4} stagger={10} data-testid="t" />)
    expect(columns().map((column) => column.style.paddingTop)).toEqual(["20%", "10%", "0%", "20%"])
  })

  it("puts the perspective, the fade mask and the saturation on the root", () => {
    const { rerender } = render(<TiltedTiles images={images} data-testid="t" />)
    const root = screen.getByTestId("t")
    expect(root.style.perspective).toBe("1600px")
    expect(root.style.maskImage).toContain("linear-gradient")
    expect(root.style.getPropertyValue("-webkit-mask-image")).toContain("linear-gradient")
    expect(root.style.filter).toBe("")

    rerender(<TiltedTiles images={images} fadeTop={0} fadeBottom={0} saturation={0.5} data-testid="t" />)
    expect(root.style.maskImage).toBe("")
    expect(root.style.filter).toBe("saturate(0.5)")
  })

  it("shows plain placeholder tiles without images", () => {
    render(<TiltedTiles images={[]} columns={2} data-testid="t" />)
    for (const strip of strips()) {
      for (const tile of Array.from(strip.children) as HTMLElement[]) {
        expect(tile).toHaveClass("bg-muted")
        expect(tile.style.backgroundImage).toBe("")
      }
    }
  })

  it("is decoration unless it is given a label", () => {
    const { rerender } = render(<TiltedTiles data-testid="t" />)
    expect(screen.getByTestId("t")).toHaveAttribute("aria-hidden", "true")
    rerender(<TiltedTiles aria-label="Architecture photographs" data-testid="t" />)
    expect(screen.getByRole("img", { name: "Architecture photographs" })).toBe(screen.getByTestId("t"))
    expect(screen.getByTestId("t")).not.toHaveAttribute("aria-hidden")
  })

  it("runs the loop, and freezes it on the first frame under reduced motion", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame")
    const { unmount } = render(<TiltedTiles images={images} />)
    expect(raf).toHaveBeenCalled()
    unmount()
    raf.mockClear()

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia
    render(<TiltedTiles images={images} columns={2} data-testid="t" />)
    expect(raf).not.toHaveBeenCalled()
    const plane = screen.getByTestId("t").firstElementChild as HTMLElement
    expect(plane.style.transform).toBe(planeTransform(40, 16, -20, -40, 0, 0))
    expect(strips().map((strip) => strip.style.transform)).toEqual([stripTransform(0, 3, 8), stripTransform(1, 3, 8)])
  })

  it("forwards style and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<TiltedTiles ref={ref} images={images} style={{ height: 320 }} data-testid="t" />)
    expect(ref.current).toBe(screen.getByTestId("t"))
    expect(screen.getByTestId("t").style.height).toBe("320px")
    expect(screen.getByTestId("t").style.perspective).toBe("1600px")
  })
})
