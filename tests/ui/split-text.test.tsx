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
    expect(root()).toHaveAccessibleName("abc")
  })

  // Whitespace is a bare text node between the wrappers, so only the words are animated units.
  it('renders one unit per word when by="words"', () => {
    render(<SplitText by="words">hello world</SplitText>)
    expect(unitsOf(root())).toHaveLength(2)
    expect(unitsOf(root()).map((unit) => unit.textContent)).toEqual(["hello", "world"])
  })

  // The original critical bug was a lone U+0020 inside an inline-block, which CSS trims to zero
  // width. Its NBSP-in-an-inline-block fix could not be trimmed at a line end either, which pushed
  // wrapped centred lines off-centre. A separator that is a text node in the parent's inline
  // formatting context is an ordinary space: full width mid-line, trimmed at a line end.
  it("emits whitespace as a bare text node between the unit wrappers, never inside one", () => {
    render(<SplitText by="words">hello world</SplitText>)
    const children = Array.from(root().childNodes)
    expect(children.map((node) => node.nodeType)).toEqual([
      Node.ELEMENT_NODE,
      Node.TEXT_NODE,
      Node.ELEMENT_NODE,
    ])
    expect(children[1].textContent).toBe(" ")
    for (const unit of unitsOf(root())) expect(unit.textContent).not.toMatch(/^\s+$/)
  })

  it("preserves the length of a whitespace run", () => {
    render(<SplitText by="words">hello  world</SplitText>)
    expect(Array.from(root().childNodes)[1].textContent).toBe("  ")
  })

  // A second, screen-reader-only copy of the string would put it in textContent, innerText and the
  // clipboard twice. The string is in the DOM once; the accessible name carries it to assistive tech.
  it("puts the text in the DOM exactly once so extraction and copy return it once", () => {
    render(<SplitText by="words">Introducing mewo</SplitText>)
    expect(root().textContent).toBe("Introducing mewo")
    expect(root().querySelector(".sr-only")).toBeNull()
    expect(root()).toHaveAccessibleName("Introducing mewo")
  })

  // aria-label is prohibited on role=generic (span) and role=paragraph (p), so those two roots are
  // exposed as an image with a text alternative instead. A heading can name itself.
  it("names itself through a role that permits a label", () => {
    render(<SplitText>Introducing mewo</SplitText>)
    expect(root().tagName).toBe("SPAN")
    expect(root()).toHaveAttribute("role", "img")
    expect(root()).toHaveAccessibleName("Introducing mewo")
    for (const unit of unitsOf(root())) expect(unit.closest("[aria-hidden]")).not.toBeNull()
  })

  it("keeps the implicit role when that role permits a label", () => {
    render(<SplitText as="h2">Introducing mewo</SplitText>)
    expect(root()).not.toHaveAttribute("role")
    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName("Introducing mewo")
  })

  it("exposes a paragraph as an image too, since role=paragraph prohibits a label", () => {
    render(<SplitText as="p">Introducing mewo</SplitText>)
    expect(root().tagName).toBe("P")
    expect(root()).toHaveAttribute("role", "img")
    expect(root()).toHaveAccessibleName("Introducing mewo")
  })

  it("renders the requested element and forwards className", () => {
    render(<SplitText as="h1" className="text-5xl">Title</SplitText>)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveAccessibleName("Title")
    expect(heading).toHaveClass("text-5xl")
  })
})
