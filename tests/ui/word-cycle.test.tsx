import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { WordCycle, longestWord } from "@/registry/mewo/ui/word-cycle"

describe("longestWord", () => {
  it("picks the longest word", () => {
    expect(longestWord(["a", "abcd", "abc"])).toBe("abcd")
  })
})

describe("WordCycle", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("shows one word at a time and moves on after the interval", () => {
    const { container } = render(<WordCycle words={["one", "two"]} interval={1000} className="font-bold" />)
    const root = container.querySelector('[data-slot="word-cycle"]')!
    expect(root).toHaveClass("font-bold")
    const shown = () => [...root.querySelectorAll('span[aria-hidden="false"]')].map((s) => s.textContent)
    expect(shown()).toEqual(["one"])
    act(() => vi.advanceTimersByTime(1000))
    expect(shown()).toEqual(["two"])
  })
})
