import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PictureFigure } from "@/registry/mewo/ui/picture-figure"

describe("PictureFigure", () => {
  it("renders the picture at its ratio with data-slot and the merged className", () => {
    const { container } = render(<PictureFigure className="h-40" src="/a.jpg" alt="A portrait" ratio={0.75} />)
    expect(container.querySelector('[data-slot="picture-figure"]')).toHaveClass("relative", "h-40")
    expect(screen.getByRole("img", { name: "A portrait" }).parentElement).toHaveStyle({ aspectRatio: "0.75" })
  })

  it("hangs its caption in a figcaption only when given one", () => {
    const { container, rerender } = render(<PictureFigure />)
    expect(container.querySelector("figcaption")).toBeNull()
    rerender(<PictureFigure caption="A credit" />)
    expect(container.querySelector("figcaption")).toHaveTextContent("A credit")
  })
})
