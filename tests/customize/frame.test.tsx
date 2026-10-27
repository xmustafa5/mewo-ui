import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CustomizeFrame, UsageBlock } from "@/components/customize/frame"

const usage = { name: "Marquee", item: "marquee", props: { speed: 40 } }

describe("CustomizeFrame", () => {
  it("keeps the Preview and Code tabs and puts the panel under the stage", () => {
    render(
      <CustomizeFrame code={<pre>source</pre>} usage={usage} preview={<p>demo</p>} run={0} onReplay={() => {}} changed={false} onReset={() => {}}>
        <div data-control>a row</div>
      </CustomizeFrame>,
    )
    expect(screen.getByRole("tab", { name: "Preview" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument()
    expect(screen.getByText("demo")).toBeVisible()
    expect(screen.getByRole("heading", { name: "Customize" })).toBeInTheDocument()
    expect(screen.getByText("a row")).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Customize" })).toBeNull()
  })

  it("shows Reset only while something is changed", () => {
    const onReset = vi.fn()
    const { rerender } = render(
      <CustomizeFrame code={<pre>source</pre>} preview={<p>demo</p>} run={0} onReplay={() => {}} changed={false} onReset={onReset}>
        <div />
      </CustomizeFrame>,
    )
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull()
    rerender(
      <CustomizeFrame code={<pre>source</pre>} preview={<p>demo</p>} run={0} onReplay={() => {}} changed onReset={onReset}>
        <div />
      </CustomizeFrame>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(onReset).toHaveBeenCalled()
  })

  it("replays, and remounts the preview when run changes", () => {
    const onReplay = vi.fn()
    const { rerender } = render(
      <CustomizeFrame code={<pre>source</pre>} preview={<input defaultValue="typed" />} run={0} onReplay={onReplay} changed={false} onReset={() => {}}>
        <div />
      </CustomizeFrame>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Replay animation" }))
    expect(onReplay).toHaveBeenCalled()
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "changed" } })
    rerender(
      <CustomizeFrame code={<pre>source</pre>} preview={<input defaultValue="typed" />} run={1} onReplay={onReplay} changed={false} onReset={() => {}}>
        <div />
      </CustomizeFrame>,
    )
    expect(screen.getByRole("textbox")).toHaveValue("typed")
  })

  it("offers the Studio when a piece has one", () => {
    render(
      <CustomizeFrame code={<pre>source</pre>} preview={<p>demo</p>} run={0} onReplay={() => {}} changed={false} onReset={() => {}} studioHref="/studio?bg=grainient">
        <div />
      </CustomizeFrame>,
    )
    expect(screen.getByRole("link", { name: "Open in Studio" })).toHaveAttribute("href", "/studio?bg=grainient")
  })
})

describe("CustomizeFrame width", () => {
  const frame = () => document.querySelector<HTMLElement>('[data-slot="customize-frame"]')!
  const renderFrame = () =>
    render(
      <CustomizeFrame code={<pre>source</pre>} preview={<p>demo</p>} run={0} onReplay={() => {}} changed={false} onReset={() => {}}>
        <div />
      </CustomizeFrame>,
    )

  it("offers Desktop, Tablet and Mobile and narrows the frame to the chosen width", () => {
    renderFrame()
    expect(screen.getByRole("group", { name: "Preview width" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute("aria-pressed", "true")
    expect(frame().style.maxWidth).toBe("")
    fireEvent.click(screen.getByRole("button", { name: "Mobile · 375px" }))
    expect(frame().style.maxWidth).toBe("375px")
    expect(frame()).toHaveAttribute("data-narrow")
    fireEvent.click(screen.getByRole("button", { name: "Desktop" }))
    expect(frame().style.maxWidth).toBe("")
  })

  it("has a handle the keys step, Home at the narrowest and End at the full width", () => {
    renderFrame()
    fireEvent.click(screen.getByRole("button", { name: "Tablet · 768px" }))
    const handle = screen.getByRole("separator", { name: "Drag to resize the preview" })
    expect(handle).toHaveAttribute("aria-valuenow", "768")
    fireEvent.keyDown(handle, { key: "ArrowLeft" })
    expect(frame().style.maxWidth).toBe("758px")
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true })
    expect(frame().style.maxWidth).toBe("808px")
    fireEvent.keyDown(handle, { key: "Home" })
    expect(frame().style.maxWidth).toBe("320px")
    fireEvent.keyDown(handle, { key: "End" })
    expect(frame().style.maxWidth).toBe("")
    fireEvent.click(screen.getByRole("button", { name: "Mobile · 375px" }))
    fireEvent.doubleClick(handle)
    expect(frame().style.maxWidth).toBe("")
  })
})

describe("UsageBlock", () => {
  it("prints the snippet and says when it carries changes", () => {
    const { rerender } = render(<UsageBlock usage={{ ...usage, props: {} }} changed={false} />)
    expect(screen.getByText("Usage")).toBeInTheDocument()
    expect(screen.queryByText("With your settings")).toBeNull()
    expect(screen.getAllByText("Marquee", { selector: ".line span" })).toHaveLength(2)
    rerender(<UsageBlock usage={usage} changed />)
    expect(screen.getByText("With your settings")).toBeInTheDocument()
    expect(screen.getByText("{40}")).toBeInTheDocument()
  })

  it("copies the text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<UsageBlock usage={usage} changed />)
    fireEvent.click(screen.getByRole("button", { name: "Copy" }))
    expect(writeText).toHaveBeenCalledWith('import { Marquee } from "@/components/ui/marquee"\n\n<Marquee speed={40} />')
    expect(await screen.findByText("Copied")).toBeInTheDocument()
  })
})
