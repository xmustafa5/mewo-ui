import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { FramedPreview, useFramedValues } from "@/components/customize/framed"

const DEFAULTS = { title: "Hello", length: 3 }
function Framed() {
  const values = useFramedValues(DEFAULTS)
  return (
    <p>
      {values.title} {values.length}
    </p>
  )
}

const message = (data: unknown, origin = window.location.origin) => new MessageEvent("message", { data, origin })

describe("useFramedValues", () => {
  it("renders the defaults, then the values the page sends from the same origin", () => {
    render(<Framed />)
    expect(screen.getByText("Hello 3")).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(message({ source: "mewo-customize", type: "values", values: { title: "Yo" } }, "https://elsewhere.example"))
    })
    expect(screen.getByText("Hello 3")).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(message({ source: "mewo-customize", type: "values", values: { title: "Yo", length: 5 } }))
    })
    expect(screen.getByText("Yo 5")).toBeInTheDocument()
  })
})

describe("FramedPreview", () => {
  it("frames the section's customize page and posts the values into it on load and on change", () => {
    const { rerender } = render(<FramedPreview name="names-duel" values={{ title: "A" }} run={0} />)
    const frame = screen.getByTitle("names-duel preview") as HTMLIFrameElement
    expect(frame).toHaveAttribute("src", "/preview/names-duel/customize")
    const postMessage = vi.fn()
    Object.defineProperty(frame, "contentWindow", { value: { postMessage }, configurable: true })
    act(() => {
      frame.dispatchEvent(new Event("load"))
    })
    expect(postMessage).toHaveBeenLastCalledWith({ source: "mewo-customize", type: "values", values: { title: "A" } }, window.location.origin)
    rerender(<FramedPreview name="names-duel" values={{ title: "B" }} run={0} />)
    expect(postMessage).toHaveBeenLastCalledWith({ source: "mewo-customize", type: "values", values: { title: "B" } }, window.location.origin)
    // the frame asks again after a reload
    postMessage.mockClear()
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data: { source: "mewo-customize", type: "ready" }, origin: window.location.origin, source: frame.contentWindow }))
    })
    expect(postMessage).toHaveBeenCalledTimes(1)
  })
})
