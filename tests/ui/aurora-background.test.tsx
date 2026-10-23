import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuroraBackground } from "@/registry/mewo/ui/aurora-background"

// jsdom has no WebGL: the same path a browser without it takes.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
})
afterEach(() => vi.restoreAllMocks())

describe("AuroraBackground", () => {
  it("renders children over the aurora layer", () => {
    render(<AuroraBackground data-testid="a"><h1>Hello</h1></AuroraBackground>)
    expect(screen.getByRole("heading")).toHaveTextContent("Hello")
    expect(screen.getByTestId("a").querySelector("[aria-hidden]")).not.toBeNull()
  })

  it("applies the radial mask by default and drops it when disabled", () => {
    const { rerender } = render(<AuroraBackground data-testid="a">x</AuroraBackground>)
    const layer = () => screen.getByTestId("a").querySelector("[aria-hidden] > div") as HTMLElement
    expect(layer().className).toContain("mask-image")
    rerender(<AuroraBackground data-testid="a" showRadialMask={false}>x</AuroraBackground>)
    expect(layer().className).not.toContain("mask-image")
  })

  // The CSS gradient is the first paint and the fallback; the shader only ever replaces it.
  it("keeps the static gradient and adds no canvas when WebGL is unavailable", () => {
    render(<AuroraBackground data-testid="a">x</AuroraBackground>)
    const fallback = screen.getByTestId("a").querySelector('[data-slot="aurora-fallback"]') as HTMLElement
    expect(fallback).not.toBeNull()
    expect(fallback.style.display).toBe("")
    expect(fallback.className).not.toContain("animate-")
    expect(screen.getByTestId("a").querySelector("canvas")).toBeNull()
  })

  it("forwards className to the root", () => {
    render(<AuroraBackground className="min-h-screen" data-testid="a">x</AuroraBackground>)
    expect(screen.getByTestId("a")).toHaveClass("min-h-screen")
  })
})
