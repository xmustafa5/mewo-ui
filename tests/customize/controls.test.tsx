import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Color, ColorList } from "@/components/customize/color-picker"
import { Input, Select, Slider, Switch } from "@/components/customize/controls"

describe("Slider", () => {
  it("is a slider with its value and unit shown, stepped by the keys", () => {
    const onChange = vi.fn()
    render(<Slider label="Duration" min={0.5} max={6} step={0.1} unit="s" value={2} onChange={onChange} />)
    const slider = screen.getByRole("slider", { name: "Duration" })
    expect(slider).toHaveAttribute("aria-valuenow", "2")
    expect(screen.getByText("2s")).toBeInTheDocument()
    fireEvent.keyDown(slider, { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith(2.1)
    fireEvent.keyDown(slider, { key: "ArrowDown" })
    expect(onChange).toHaveBeenLastCalledWith(1.9)
    fireEvent.keyDown(slider, { key: "Home" })
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    fireEvent.keyDown(slider, { key: "End" })
    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  it("sets the value where the pointer lands, and does nothing while disabled", () => {
    const onChange = vi.fn()
    const { rerender } = render(<Slider label="Width" min={0} max={100} step={1} value={50} onChange={onChange} />)
    const slider = screen.getByRole("slider", { name: "Width" })
    slider.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 40, right: 200, bottom: 40, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1, pointerType: "mouse" })
    expect(onChange).toHaveBeenLastCalledWith(25)
    fireEvent.pointerMove(slider, { clientX: 150, pointerId: 1, pointerType: "mouse" })
    expect(onChange).toHaveBeenLastCalledWith(75)
    fireEvent.pointerUp(slider, { clientX: 150, pointerId: 1, pointerType: "mouse" })
    onChange.mockClear()
    rerender(<Slider label="Width" min={0} max={100} step={1} value={50} disabled onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole("slider", { name: "Width" }), { key: "ArrowRight" })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("prints the value another way when asked", () => {
    render(<Slider label="Picture" min={1} max={9} step={1} value={3} format={(value) => `#${value}`} onChange={() => {}} />)
    expect(screen.getByText("#3")).toBeInTheDocument()
  })
})

describe("Switch", () => {
  it("toggles", () => {
    const onChange = vi.fn()
    render(<Switch label="Loop" checked={false} onChange={onChange} />)
    const control = screen.getByRole("switch", { name: "Loop" })
    expect(control).toHaveAttribute("aria-checked", "false")
    fireEvent.click(control)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe("Input", () => {
  it("passes typed text on", () => {
    const onChange = vi.fn()
    render(<Input label="Text" value="Hi" onChange={onChange} />)
    fireEvent.change(screen.getByRole("textbox", { name: "Text" }), { target: { value: "Yo" } })
    expect(onChange).toHaveBeenCalledWith("Yo")
  })
})

describe("Select", () => {
  it("shows the chosen option's label on the row", () => {
    render(<Select label="Size" options={[{ value: "sm", label: "Small" }, "large"]} value="sm" onChange={() => {}} />)
    const trigger = screen.getByRole("combobox", { name: "Size" })
    expect(trigger).toHaveTextContent("Small")
  })
})

describe("Color", () => {
  it("shows the hex on the row and takes a typed colour", () => {
    const onChange = vi.fn()
    render(<Color label="Spotlight" value="#ff0000" onChange={onChange} />)
    const field = screen.getByRole("textbox", { name: "Spotlight value" })
    expect(field).toHaveValue("#ff0000")
    fireEvent.focus(field)
    fireEvent.change(field, { target: { value: "rgb(0, 0, 255)" } })
    fireEvent.keyDown(field, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("#0000ff")
  })

  it("keeps the alpha when asked", () => {
    const onChange = vi.fn()
    render(<Color label="Glow" alpha value="#ffffff1f" onChange={onChange} />)
    expect(screen.getByRole("textbox", { name: "Glow value" })).toHaveValue("#ffffff1f")
  })
})

describe("ColorList", () => {
  it("adds and removes colours within its bounds", () => {
    const onChange = vi.fn()
    const { rerender } = render(<ColorList colors={["#111111", "#222222"]} min={2} max={3} onChange={onChange} />)
    expect(screen.getByRole("button", { name: "Remove a colour" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Add a colour" }))
    expect(onChange).toHaveBeenCalledWith(["#111111", "#222222", "#1821fb"])
    rerender(<ColorList colors={["#111111", "#222222", "#1821fb"]} min={2} max={3} onChange={onChange} />)
    expect(screen.getByRole("button", { name: "Add a colour" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Remove a colour" }))
    expect(onChange).toHaveBeenLastCalledWith(["#111111", "#222222"])
    expect(screen.getAllByRole("button", { name: /^Colours \d/ })).toHaveLength(3)
  })
})
