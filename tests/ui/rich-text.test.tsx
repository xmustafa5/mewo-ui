import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RichText, parseMarkup } from "@/registry/mewo/ui/rich-text"

describe("parseMarkup", () => {
  it("splits italics and links from plain text", () => {
    expect(parseMarkup("A *big* [link] here")).toEqual([
      { kind: "text", value: "A " },
      { kind: "em", value: "big" },
      { kind: "text", value: " " },
      { kind: "link", value: "link" },
      { kind: "text", value: " here" },
    ])
  })
})

describe("RichText", () => {
  it("renders italics and a link to href, with data-slot and the merged className", () => {
    const { container } = render(<RichText text="Read *this* [source]." href="https://example.com" className="text-xl" />)
    const root = container.querySelector('[data-slot="rich-text"]')
    expect(root).toHaveClass("text-xl")
    expect(container.querySelector("em")).toHaveTextContent("this")
    expect(screen.getByRole("link", { name: "source" })).toHaveAttribute("href", "https://example.com")
  })
})
