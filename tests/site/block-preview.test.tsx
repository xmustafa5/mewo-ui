import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { BlockPreview } from "@/components/site/block-preview"

describe("BlockPreview", () => {
  it("embeds the preview route in an iframe and switches widths", () => {
    render(<BlockPreview name="names-duel" code={<pre>source</pre>} />)
    const frame = screen.getByTitle("names-duel preview") as HTMLIFrameElement
    expect(frame).toHaveAttribute("src", "/preview/names-duel")
    expect(frame.style.width).toBe("100%")

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }))
    expect(frame.style.width).toBe("390px")
    expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute("aria-pressed", "true")
  })
})
