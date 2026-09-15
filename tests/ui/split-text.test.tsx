import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    from: vi.fn(),
    set: vi.fn(),
  },
}))
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { name: "ScrollTrigger" } }))
vi.mock("@gsap/react", () => ({ useGSAP: vi.fn() }))

import { SplitText, splitUnits } from "@/registry/mewo/ui/split-text"

describe("splitUnits", () => {
  it("splits into characters, keeping spaces", () => {
    expect(splitUnits("ab c", "chars")).toEqual(["a", "b", " ", "c"])
  })

  it("splits into words, keeping whitespace runs as their own unit", () => {
    expect(splitUnits("hello  world", "words")).toEqual(["hello", "  ", "world"])
  })
})

describe("SplitText", () => {
  it("renders one animated unit per character and labels the whole text", () => {
    render(<SplitText>abc</SplitText>)
    const root = screen.getByLabelText("abc")
    expect(root.querySelectorAll("[data-split-unit]")).toHaveLength(3)
  })

  it('renders one unit per word when by="words"', () => {
    render(<SplitText by="words">hello world</SplitText>)
    expect(screen.getByLabelText("hello world").querySelectorAll("[data-split-unit]")).toHaveLength(3)
  })

  it("renders the requested element and forwards className", () => {
    render(<SplitText as="h1" className="text-5xl">Title</SplitText>)
    const root = screen.getByLabelText("Title")
    expect(root.tagName).toBe("H1")
    expect(root).toHaveClass("text-5xl")
  })
})
