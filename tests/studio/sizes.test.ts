import { describe, expect, it } from "vitest"
import { even, fitOutput, resolveLayout, SIZE_PRESETS, sizeLabel } from "@/components/studio/sizes"

describe("resolveLayout", () => {
  it("matches the stage, rounded, and falls back when there is no stage yet", () => {
    expect(resolveLayout("stage", { width: 1, height: 1 }, { width: 800.4, height: 449.6 })).toEqual({
      width: 800,
      height: 450,
    })
    expect(resolveLayout("stage", { width: 1, height: 1 }, null)).toEqual({ width: 1280, height: 720 })
  })

  it("clamps custom sizes to a sane range", () => {
    expect(resolveLayout("custom", { width: 10, height: 9000 }, null)).toEqual({ width: 64, height: 4096 })
    expect(resolveLayout("custom", { width: 0, height: 0 }, null)).toEqual({ width: 1280, height: 720 })
  })

  it("uses the named preset, and desktop for an unknown key", () => {
    expect(resolveLayout("og", { width: 1, height: 1 }, null)).toEqual({ width: 1200, height: 630 })
    expect(resolveLayout("nope", { width: 1, height: 1 }, null)).toEqual({ width: 1920, height: 1080 })
  })
})

describe("fitOutput", () => {
  it("scales up to the limit on the longest side", () => {
    expect(fitOutput({ width: 390, height: 844 }, 2, 8192)).toEqual({ width: 780, height: 1688, ratio: 2 })
    const capped = fitOutput({ width: 1920, height: 1080 }, 3, 4096, even)
    expect(capped.width).toBe(4096)
    expect(capped.height).toBe(2304)
    expect(capped.ratio).toBeCloseTo(4096 / 1920)
  })
})

describe("even", () => {
  it("rounds to an even size of at least two", () => {
    expect(even(1079)).toBe(1080)
    expect(even(1)).toBe(2)
  })
})

describe("sizeLabel", () => {
  it("adds the dimensions when the preset has them", () => {
    expect(sizeLabel(SIZE_PRESETS[1])).toBe("Desktop · 1920 × 1080")
    expect(sizeLabel(SIZE_PRESETS[0])).toBe("Match preview")
  })
})
