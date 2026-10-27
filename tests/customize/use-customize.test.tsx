import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import { ThemeProvider } from "next-themes"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { parse, serialize, useCustomize } from "@/components/customize/use-customize"

const DEFAULTS = { duration: 2, text: "Hi", loop: false, color: "#1821fb", list: ["#111111", "#222222"] }
type Api = ReturnType<typeof useCustomize<typeof DEFAULTS>>

let api: Api
function Probe({ light }: { light?: Partial<typeof DEFAULTS> }) {
  const current = useCustomize(DEFAULTS, { light })
  // handed out after each render, so the tests read the latest state
  React.useEffect(() => {
    api = current
  })
  return (
    <p>
      {current.values.duration} {current.values.text} {String(current.values.loop)} {current.values.color} {current.values.list.join(",")} {current.changed ? "changed" : "default"} run:{current.run}
    </p>
  )
}

const flush = () => act(() => vi.advanceTimersByTime(500))

describe("useCustomize", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.history.replaceState(null, "", "/docs/x")
  })
  afterEach(() => {
    flush()
    vi.useRealTimers()
  })

  it("starts at the defaults with nothing in the address", () => {
    render(<Probe />)
    expect(screen.getByText("2 Hi false #1821fb #111111,#222222 default run:0")).toBeInTheDocument()
  })

  it("reads the address, typed by each default", () => {
    window.history.replaceState(null, "", "/docs/x?duration=3.5&loop=true&color=ff0000&list=aaa,bbb&text=")
    render(<Probe />)
    expect(api.values).toEqual({ duration: 3.5, text: "", loop: true, color: "#ff0000", list: ["#aaa", "#bbb"] })
    expect(api.changed).toBe(true)
  })

  it("writes a change to the address and leaves a value that returns to its default", () => {
    render(<Probe />)
    act(() => api.set("duration", 3))
    expect(api.values.duration).toBe(3)
    expect(api.changed).toBe(true)
    flush()
    expect(window.location.search).toBe("?duration=3")
    act(() => api.set("color", "#ff0000"))
    flush()
    expect(window.location.search).toBe("?duration=3&color=ff0000")
    act(() => api.set("duration", 2))
    flush()
    expect(window.location.search).toBe("?color=ff0000")
  })

  it("resets every key of its own and keeps the others", () => {
    window.history.replaceState(null, "", "/docs/x?piece=a&duration=4")
    render(<Probe />)
    act(() => api.reset())
    expect(api.changed).toBe(false)
    flush()
    expect(window.location.search).toBe("?piece=a")
  })

  it("remounts on replay and on a control marked replay", () => {
    render(<Probe />)
    act(() => api.replay())
    expect(api.run).toBe(1)
    act(() => api.set("loop", true, { replay: true }))
    expect(api.run).toBe(2)
    act(() => api.setMany({ duration: 5, text: "Yo" }, { replay: true }))
    expect(api.run).toBe(3)
    expect(api.values).toMatchObject({ duration: 5, text: "Yo", loop: true })
  })

  it("follows the light table while a value is still at its default", () => {
    render(
      <ThemeProvider attribute="class">
        <Probe light={{ color: "#000000" }} />
      </ThemeProvider>,
    )
    // jsdom's matchMedia says the system is not dark, so the theme resolves to light
    expect(api.values.color).toBe("#000000")
    expect(api.changed).toBe(false)
    act(() => api.set("color", "#000000"))
    flush()
    expect(window.location.search).toBe("")
  })
})

describe("serialize and parse", () => {
  it("drop the hash of a colour and join a list", () => {
    expect(serialize("#1821fb")).toBe("1821fb")
    expect(serialize(["#111111", "x"])).toBe("111111,x")
    expect(serialize(2.5)).toBe("2.5")
    expect(parse("1821fb", "#000")).toBe("#1821fb")
    expect(parse("abc", 2)).toBe(2)
    expect(parse("", 2)).toBe(2)
    expect(parse("", [])).toEqual([])
    expect(parse("yes", false)).toBe(false)
  })
})
