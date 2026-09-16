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

const root = () => document.querySelector('[data-slot="split-text"]') as HTMLElement
const unitsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-split-unit]"))

describe("splitUnits", () => {
  it("splits into characters, keeping spaces", () => {
    expect(splitUnits("ab c", "chars")).toEqual(["a", "b", " ", "c"])
  })

  it("splits into words, keeping whitespace runs as their own unit", () => {
    expect(splitUnits("hello  world", "words")).toEqual(["hello", "  ", "world"])
  })

  it("keeps grapheme clusters whole", () => {
    expect(splitUnits("🇮🇶", "chars")).toEqual(["🇮🇶"])
    expect(splitUnits("👨‍👩‍👧", "chars")).toEqual(["👨‍👩‍👧"])
    expect(splitUnits("👋🏽", "chars")).toEqual(["👋🏽"])
    expect(splitUnits("é", "chars")).toEqual(["é"])
  })
})

describe("SplitText", () => {
  it("renders one animated unit per character and carries the text for assistive tech", () => {
    render(<SplitText>abc</SplitText>)
    expect(unitsOf(root())).toHaveLength(3)
    expect(root().querySelector(".sr-only")).toHaveTextContent("abc")
  })

  it('renders one unit per word when by="words"', () => {
    render(<SplitText by="words">hello world</SplitText>)
    expect(unitsOf(root())).toHaveLength(3)
  })

  // jsdom has no layout engine and textContent/accessible name are unaffected by this bug,
  // so the only assertion that can catch it is the codepoint of the separator itself.
  it("renders a whitespace unit as U+00A0, never a collapsible U+0020", () => {
    render(<SplitText by="words">hello world</SplitText>)
    const separator = unitsOf(root())[1]
    expect(separator.textContent).toBe(" ")
    expect(separator.textContent).not.toBe(" ")
    expect(separator.textContent?.codePointAt(0)).toBe(0x00a0)
  })

  it("preserves the length of a whitespace run", () => {
    render(<SplitText by="words">hello  world</SplitText>)
    expect(unitsOf(root())[1].textContent).toBe("  ")
  })

  it("does not put a prohibited aria-label on the root", () => {
    render(<SplitText>Introducing mewo</SplitText>)
    expect(root().tagName).toBe("SPAN")
    expect(root()).not.toHaveAttribute("aria-label")
    expect(root().querySelector(".sr-only")).toHaveTextContent("Introducing mewo")
    for (const unit of unitsOf(root())) expect(unit.closest("[aria-hidden]")).not.toBeNull()
  })

  it("renders the requested element and forwards className", () => {
    render(<SplitText as="h1" className="text-5xl">Title</SplitText>)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveAccessibleName("Title")
    expect(heading).toHaveClass("text-5xl")
  })
})
