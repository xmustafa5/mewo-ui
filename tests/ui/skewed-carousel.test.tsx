import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SkewedCarousel, landingIndex, slidePose, stepSpring } from "@/registry/mewo/ui/skewed-carousel"

const items = ["One", "Two", "Three", "Four"].map((title, i) => ({ title, image: `/img-${i}.jpg` }))
const current = () => screen.getAllByRole("button", { current: true })

describe("slidePose", () => {
  it("leaves the active slide flat, full size and with its caption in place", () => {
    expect(slidePose(0, 60, 0.85)).toEqual({ rotate: -0, scale: 1, captionY: 0 })
  })

  it("turns each slide by the rotation per step, toward the active one", () => {
    expect(slidePose(-3, 60, 0.85).rotate).toBe(180)
    expect(slidePose(2, 60, 0.85)).toEqual({ rotate: -120, scale: 0.85, captionY: 10 })
  })
})

describe("landingIndex", () => {
  it("holds at the ends without loop and wraps with it", () => {
    expect(landingIndex(-1, 4, false)).toBe(0)
    expect(landingIndex(9, 4, false)).toBe(3)
    expect(landingIndex(-1, 4, true)).toBe(3)
    expect(landingIndex(4, 4, true)).toBe(0)
  })
})

describe("stepSpring", () => {
  it("settles on its target", () => {
    const s = { x: 0, v: 0, target: 1 }
    stepSpring(s, 11.25, 0.8, 2)
    expect(s.x).toBeCloseTo(1, 4)
  })
})

describe("SkewedCarousel", () => {
  it("renders the root with the merged className, data-slot and the default slides", () => {
    render(<SkewedCarousel className="py-6" data-testid="c" />)
    const root = screen.getByTestId("c")
    expect(root).toHaveClass("relative", "w-full", "overflow-hidden", "py-6")
    expect(root).toHaveAttribute("data-slot", "skewed-carousel")
    expect(root.querySelectorAll('[data-slot="skewed-carousel-card"]')).toHaveLength(10)
  })

  it("moves with the buttons, the dots and the arrow keys, and reports the change", () => {
    const onIndexChange = vi.fn()
    render(<SkewedCarousel items={items} initialIndex={1} onIndexChange={onIndexChange} data-testid="c" />)
    expect(current()[0]).toHaveAccessibleName("Two")

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)

    fireEvent.click(screen.getByRole("button", { name: "Show One" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled()

    fireEvent.keyDown(screen.getByTestId("c"), { key: "ArrowRight" })
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
  })

  it("moves one slide on a swipe of 45px and ignores a shorter one", () => {
    const onIndexChange = vi.fn()
    const { container } = render(<SkewedCarousel items={items} initialIndex={1} onIndexChange={onIndexChange} />)
    const strip = container.querySelector(".touch-pan-y") as HTMLElement
    fireEvent.pointerDown(strip, { pointerId: 1, clientX: 200, button: 0, pointerType: "mouse" })
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 170, pointerType: "mouse" })
    expect(onIndexChange).not.toHaveBeenCalled()
    fireEvent.pointerDown(strip, { pointerId: 1, clientX: 200, button: 0, pointerType: "mouse" })
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 150, pointerType: "mouse" })
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it("hides the controls, dots and captions when asked", () => {
    render(<SkewedCarousel items={items} showControls={false} showDots={false} showTitles={false} />)
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Show One" })).toBeNull()
    expect(screen.queryByText("Two", { selector: "span" })).toBeNull()
  })
})
