import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PictureWave, buildField, pictureAspect, waveScale, wavePoint, wordsAt } from "@/registry/mewo/ui/picture-wave"

describe("waveScale", () => {
  it("grows from nothing to full size and holds there", () => {
    expect(waveScale(-1)).toBe(0)
    expect(waveScale(0)).toBe(0)
    expect(waveScale(0.5)).toBeGreaterThan(0.4)
    expect(waveScale(0.5)).toBeLessThan(0.6)
    expect(waveScale(1.13)).toBe(1)
    expect(waveScale(5)).toBe(1)
  })
})

describe("wordsAt", () => {
  it("shows the words while the wave holds, dims them just before the burst, then hides them", () => {
    expect(wordsAt(0)).toBe("off")
    expect(wordsAt(1)).toBe("on")
    expect(wordsAt(1.88)).toBe("on")
    expect(wordsAt(2)).toBe("dim")
    expect(wordsAt(3)).toBe("off")
  })
})

describe("wavePoint", () => {
  it("runs along the long axis from one end to the other", () => {
    const p = [0, 0]
    expect(wavePoint("horizontal", 0, p)[0]).toBeCloseTo(-0.4035)
    expect(wavePoint("horizontal", 1, p)[0]).toBeCloseTo(0.4035)
    expect(wavePoint("vertical", 0, p)[1]).toBeCloseTo(-0.2695)
    expect(wavePoint("vertical", 1, p)[1]).toBeCloseTo(0.2695)
  })
})

describe("pictureAspect", () => {
  it("keeps a card's proportions between 0.6 and 1.7", () => {
    expect(pictureAspect(0.3)).toBe(0.6)
    expect(pictureAspect(1.2)).toBe(1.2)
    expect(pictureAspect(3)).toBe(1.7)
  })
})

describe("buildField", () => {
  const pictures = Array.from({ length: 24 }, (_, i) => 0.6 + (i % 6) * 0.2)

  it("is the same for the same seed and pictures", () => {
    expect(buildField("horizontal", 21, pictures)).toEqual(buildField("horizontal", 21, pictures))
  })

  it("keeps the pictures clear of the centre column, and pale cards without a picture", () => {
    const cards = buildField("horizontal", 21, pictures)
    expect(cards.some((c) => c.cls === 1 && c.img === -1)).toBe(true)
    for (const c of cards) if (c.cls === 0) expect(Math.abs(c.at0[0]) - c.at0[2] / 2).toBeGreaterThanOrEqual(0.34 - 1e-9)
  })

  it("shows every picture somewhere", () => {
    const shown = new Set(buildField("horizontal", 21, pictures).map((c) => c.img))
    for (let i = 0; i < pictures.length; i++) expect(shown).toContain(i)
  })
})

describe("PictureWave", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders its root with data-slot, the merged className and the words, and no canvas without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    const { container, getByText } = render(<PictureWave className="h-40" words={["One", "Two"]} />)
    const root = container.querySelector('[data-slot="picture-wave"]')!
    expect(root).toHaveClass("relative", "w-full", "h-40")
    expect(getByText("One")).toBeInTheDocument()
    expect(getByText("Two")).toBeInTheDocument()
    expect(root.querySelector("canvas")).toBeNull()
  })

  it("leaves the words out when there are none, and hands its root to the consumer's ref", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(<PictureWave ref={ref} words={[]} />)
    expect(container.querySelector("p")).toBeNull()
    expect(ref.current?.dataset.slot).toBe("picture-wave")
  })
})
