import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DepthCard, cardTilt, easeFactor, fadedStop, layerShift, pointerTarget } from "@/registry/mewo/ui/depth-card"

const part = (root: HTMLElement, slot: string) => root.querySelector<HTMLElement>(`[data-slot="depth-card-${slot}"]`)
const layersOf = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-slot="depth-card-layer"]'))
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const rect = { left: 0, top: 0, width: 240, height: 320, right: 240, bottom: 320, x: 0, y: 0, toJSON: () => ({}) } as DOMRect

describe("easeFactor", () => {
  it("covers a tenth of the remaining distance per 60 fps frame", () => {
    expect(easeFactor(1 / 60)).toBeCloseTo(0.1, 10)
  })

  it("eases the same at any frame rate", () => {
    const half = easeFactor(1 / 120)
    expect(1 - (1 - half) ** 2).toBeCloseTo(easeFactor(1 / 60), 10)
  })
})

describe("pointerTarget", () => {
  it("maps the card to −1…1 from its centre and holds at the edges", () => {
    expect(pointerTarget(120, 160, 240, 320)).toEqual({ x: 0, y: 0 })
    expect(pointerTarget(240, 0, 240, 320)).toEqual({ x: 1, y: -1 })
    expect(pointerTarget(300, 400, 240, 320)).toEqual({ x: 1, y: 1 })
  })

  it("stays centred on a card with no size yet", () => {
    expect(pointerTarget(10, 10, 0, 0)).toEqual({ x: 0, y: 0 })
  })
})

describe("cardTilt and layerShift", () => {
  it("dips the card where the pointer is", () => {
    expect(cardTilt(1, 1, 20)).toEqual({ rotateX: -20, rotateY: 20 })
    expect(cardTilt(-0.5, -1, 20)).toEqual({ rotateX: 20, rotateY: -10 })
  })

  it("slides the layers away from the pointer, deeper layers further", () => {
    expect(layerShift(1, -0.5, 20, 1)).toEqual({ x: -20, y: 10 })
    expect(layerShift(1, -0.5, 20, 1.5)).toEqual({ x: -30, y: 15 })
  })
})

describe("fadedStop", () => {
  it("keeps the colour at a fifth of its alpha", () => {
    expect(fadedStop("rgba(255, 255, 255, 0.5)")).toBe("rgba(255, 255, 255, 0.1)")
    expect(fadedStop("rgb(10 20 30)")).toBe("rgba(10, 20, 30, 0.2)")
    expect(fadedStop("rgba(0, 0, 0, 50%)")).toBe("rgba(0, 0, 0, 0.1)")
  })

  it("falls back to a faint white for a colour it cannot read", () => {
    expect(fadedStop("#fff")).toBe("rgba(255, 255, 255, 0.1)")
  })
})

describe("DepthCard", () => {
  const matchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMedia
    vi.restoreAllMocks()
  })

  it("renders the root with data-slot, the merged className and its default content", () => {
    render(<DepthCard className="cursor-default" data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(root.tagName).toBe("DIV")
    expect(root).toHaveAttribute("data-slot", "depth-card")
    expect(root).toHaveClass("relative", "overflow-hidden", "cursor-default")
    // cn() merges Tailwind classes: the consumer's cursor wins over the default one.
    expect(root).not.toHaveClass("cursor-pointer")
    expect(root).toHaveStyle({ width: "240px", height: "320px" })
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Quiet Ridge")
    expect(screen.getByText("First light over the high pass.")).toBeInTheDocument()
    expect(layersOf(root)).toHaveLength(1)
    expect(layersOf(root)[0].style.backgroundImage).toContain("picsum.photos/seed/mewo-depth-card-1")
  })

  it("keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<DepthCard ref={ref} data-testid="c" />)
    expect(ref.current).toBe(screen.getByTestId("c"))
  })

  it("renders a link with href, and opens a new tab safely", () => {
    render(<DepthCard href="/trips" target="_blank" title="Trips" />)
    const link = screen.getByRole("link", { name: "Trips" })
    expect(link).toHaveAttribute("data-slot", "depth-card")
    expect(link).toHaveAttribute("href", "/trips")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("is a button with onClick, pressed by a click, Enter or Space", () => {
    const onClick = vi.fn()
    render(<DepthCard title="Peaks" onClick={onClick} />)
    const button = screen.getByRole("button", { name: "Peaks" })
    expect(button).toHaveAttribute("tabindex", "0")
    fireEvent.click(button)
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.keyDown(button, { key: " " })
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it("stacks the layers, later ones in front and see-through", () => {
    const { container } = render(
      <DepthCard
        imageAlt="A forest"
        layers={[
          { image: "/back.png", depth: 1 },
          { image: "/front.png", depth: 1.5 },
        ]}
      />
    )
    const [back, front] = layersOf(container)
    expect(back.style.backgroundImage).toBe('url("/back.png")')
    expect(back.style.opacity).toBe("1")
    expect(front.style.backgroundImage).toBe('url("/front.png")')
    expect(front.style.zIndex).toBe("1")
    expect(front.style.opacity).toBe("0.6")
    expect(screen.getByRole("img", { name: "A forest" })).toBeInTheDocument()
  })

  it("reveals the text and the spotlight while hovered", () => {
    render(<DepthCard data-testid="c" />)
    const root = screen.getByTestId("c")
    const description = screen.getByText("First light over the high pass.")
    expect(description).toHaveClass("translate-y-4", "opacity-0")
    expect(part(root, "spotlight")).toHaveClass("opacity-0")
    fireEvent.pointerEnter(root)
    expect(description).not.toHaveClass("translate-y-4", "opacity-0")
    expect(part(root, "spotlight")).toHaveClass("opacity-100")
    fireEvent.pointerLeave(root)
    expect(description).toHaveClass("translate-y-4", "opacity-0")
  })

  it("leaves the spotlight out when it is turned off", () => {
    render(<DepthCard spotlight={false} data-testid="c" />)
    expect(part(screen.getByTestId("c"), "spotlight")).toBeNull()
  })

  it("tilts toward the pointer and moves the spotlight with a transform", async () => {
    render(<DepthCard data-testid="c" />)
    const root = screen.getByTestId("c")
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue(rect)
    fireEvent.pointerEnter(root)
    fireEvent.pointerMove(root, { clientX: 240, clientY: 80 })
    await nextFrame()
    const transform = part(root, "surface")!.style.transform
    expect(parseFloat(/rotateX\(([-\d.]+)deg\)/.exec(transform)![1])).toBeGreaterThan(0)
    expect(parseFloat(/rotateY\(([-\d.]+)deg\)/.exec(transform)![1])).toBeGreaterThan(0)
    expect(layersOf(root)[0].style.transform).toMatch(/^translateX\(-[\d.]+px\) translateY\([\d.]+px\) scale\(1\.3\)$/)
    // The light moves by transform alone; the layer that blurs and blends it stays put.
    expect(part(root, "light")!.style.transform).toBe("translate3d(240.00px, 80.00px, 0)")
    expect(part(root, "spotlight")!.style.transform).toBe("")
  })

  it("keeps the card flat and the spotlight off under reduced motion", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia
    render(<DepthCard data-testid="c" />)
    const root = screen.getByTestId("c")
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue(rect)
    fireEvent.pointerEnter(root)
    fireEvent.pointerMove(root, { clientX: 240, clientY: 80 })
    await nextFrame()
    expect(part(root, "surface")!.style.transform).toBe("rotateX(0.0000deg) rotateY(0.0000deg)")
    expect(part(root, "spotlight")).toHaveClass("opacity-0")
    // The text still reveals: only the motion that follows the pointer is held.
    expect(screen.getByText("First light over the high pass.")).not.toHaveClass("opacity-0")
  })
})
