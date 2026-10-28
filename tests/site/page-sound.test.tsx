import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PAGE_SOUND, PageSound } from "@/components/site/page-sound"

const navigation = vi.hoisted(() => ({ pathname: "/" }))
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }))

const play = vi.fn(() => Promise.resolve())
const sources: string[] = []

class MockAudio {
  preload = ""
  volume = 1
  currentTime = 0
  play = play
  constructor(src: string) {
    sources.push(src)
  }
}

describe("PageSound", () => {
  beforeEach(() => {
    navigation.pathname = "/"
    play.mockClear()
    sources.length = 0
    vi.stubGlobal("Audio", MockAudio)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("stays quiet on the first load", () => {
    render(<PageSound />)
    expect(sources).toEqual([PAGE_SOUND])
    expect(play).not.toHaveBeenCalled()
  })

  it("plays once each time the page changes", () => {
    const { rerender } = render(<PageSound />)
    navigation.pathname = "/docs"
    rerender(<PageSound />)
    rerender(<PageSound />)
    navigation.pathname = "/docs/marquee"
    rerender(<PageSound />)
    expect(play).toHaveBeenCalledTimes(2)
  })

  it("stays quiet inside a frame", () => {
    vi.spyOn(window, "top", "get").mockReturnValue({} as Window)
    const { rerender } = render(<PageSound />)
    navigation.pathname = "/docs"
    rerender(<PageSound />)
    expect(sources).toEqual([])
    expect(play).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
