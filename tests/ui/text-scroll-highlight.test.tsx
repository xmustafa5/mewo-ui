import * as React from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TextScrollHighlight, wordHighlight } from "@/registry/mewo/ui/text-scroll-highlight"

const words = () => Array.from(screen.getByTestId("t").querySelectorAll<HTMLElement>('[data-slot="text-scroll-highlight-word"]'))

describe("wordHighlight", () => {
  it("leaves every word dark before the scroll arrives and lights them all by the end", () => {
    for (const index of [0, 4, 9]) {
      expect(wordHighlight(index, 10, 0, 4)).toBe(0)
      expect(wordHighlight(index, 10, 1, 4)).toBe(1)
    }
  })

  it("lights words in reading order, a few part-lit at a time", () => {
    // Half way through ten words with four in transition: 7 words reached.
    expect(wordHighlight(2, 10, 0.5, 4)).toBe(1)
    expect(wordHighlight(5, 10, 0.5, 4)).toBe(0.5)
    expect(wordHighlight(6, 10, 0.5, 4)).toBe(0.25)
    expect(wordHighlight(7, 10, 0.5, 4)).toBe(0)
  })

  it("switches each word on at a stroke when nothing is spread", () => {
    expect(wordHighlight(4, 10, 0.5, 0)).toBe(1)
    expect(wordHighlight(5, 10, 0.5, 0)).toBe(0)
  })
})

describe("TextScrollHighlight", () => {
  // Restored by hand: a blanket restore would also undo the mocks tests/setup.ts installs.
  let placement: { mockRestore: () => void } | undefined
  afterEach(() => {
    placement?.mockRestore()
    placement = undefined
  })

  it("wraps each word and leaves the text reading exactly as written", () => {
    render(<TextScrollHighlight data-testid="t">{"One  two\nthree"}</TextScrollHighlight>)
    const root = screen.getByTestId("t")
    expect(root).toHaveAttribute("data-slot", "text-scroll-highlight")
    expect(words().map((word) => word.textContent)).toEqual(["One", "two", "three"])
    // Whitespace is kept as plain text between the words, not swallowed or wrapped.
    expect(root.textContent).toBe("One  two\nthree")
  })

  // Hiding the words from assistive tech, as an entrance animation might, would hide the text itself.
  it("keeps the words in the accessibility tree", () => {
    render(<TextScrollHighlight data-testid="t">Plain readable text</TextScrollHighlight>)
    expect(screen.getByTestId("t")).not.toHaveAttribute("aria-label")
    for (const word of words()) expect(word).not.toHaveAttribute("aria-hidden")
  })

  // jsdom lays nothing out, so the text's place on screen is supplied here.
  const placeAt = (top: number) => {
    placement = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ top, bottom: top + 100, height: 100 } as DOMRect)
  }

  it("keeps every word dim while the text is still below the viewport", () => {
    placeAt(window.innerHeight + 500)
    render(<TextScrollHighlight dimOpacity={0.35} data-testid="t">Dim until reached</TextScrollHighlight>)
    for (const word of words()) expect(word.style.opacity).toBe("0.35")
  })

  it("has every word lit once the text has scrolled past", () => {
    placeAt(-500)
    render(<TextScrollHighlight dimOpacity={0.35} data-testid="t">Lit once passed</TextScrollHighlight>)
    for (const word of words()) expect(word.style.opacity).toBe("1")
  })

  it("renders a paragraph unless told otherwise", () => {
    const { rerender } = render(<TextScrollHighlight data-testid="t">Text</TextScrollHighlight>)
    expect(screen.getByTestId("t").tagName).toBe("P")
    rerender(<TextScrollHighlight as="h2" data-testid="t">Text</TextScrollHighlight>)
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Text")
  })

  it("renders nothing to light for an empty string", () => {
    render(<TextScrollHighlight data-testid="t">{""}</TextScrollHighlight>)
    expect(words()).toHaveLength(0)
  })

  it("renders the bare text element unless pinned", () => {
    render(<TextScrollHighlight data-testid="t">Text</TextScrollHighlight>)
    expect(screen.getByTestId("t").closest('[data-slot="text-scroll-highlight-pin"]')).toBeNull()
  })

  it("pins the text in a sticky stage inside a section as tall as its scroll runway", () => {
    const ref = React.createRef<HTMLParagraphElement>()
    render(
      <TextScrollHighlight ref={ref} pin scrollLength={2} className="text-3xl" data-testid="t">
        Held in place
      </TextScrollHighlight>
    )
    const text = screen.getByTestId("t")
    const stage = text.parentElement as HTMLElement
    const section = stage.parentElement as HTMLElement
    expect(stage).toHaveAttribute("data-slot", "text-scroll-highlight-stage")
    expect(stage).toHaveClass("sticky")
    expect(section).toHaveAttribute("data-slot", "text-scroll-highlight-pin")
    expect(section.getAttribute("style")).toContain("--mewo-length: 3")
    // className and the ref stay with the text, which is the part a consumer styles.
    expect(text).toHaveClass("text-3xl")
    expect(ref.current).toBe(text)
    expect(words().map((word) => word.textContent)).toEqual(["Held", "in", "place"])
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLParagraphElement>()
    render(<TextScrollHighlight ref={ref} className="text-3xl" data-testid="t">Text</TextScrollHighlight>)
    expect(screen.getByTestId("t")).toHaveClass("text-3xl")
    expect(ref.current).toBe(screen.getByTestId("t"))
  })
})
