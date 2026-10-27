import { describe, expect, it } from "vitest"
import { formatColor, hsvaToRgba, parseColor, rgbaToHsva, toHex } from "@/components/customize/color"

describe("parseColor", () => {
  it("reads hex in every length", () => {
    expect(parseColor("#fff")).toEqual({ r: 1, g: 1, b: 1, a: 1 })
    expect(parseColor("000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    expect(toHex(parseColor("#1821fb80")!, true)).toBe("#1821fb80")
  })

  it("reads rgb() and hsl(), with and without alpha", () => {
    expect(toHex(parseColor("rgb(24, 33, 251)")!)).toBe("#1821fb")
    expect(parseColor("rgba(255 0 0 / 50%)")?.a).toBeCloseTo(0.5)
    expect(toHex(parseColor("hsl(0, 100%, 50%)")!)).toBe("#ff0000")
    expect(parseColor("hsla(120, 100%, 50%, 0.25)")?.a).toBe(0.25)
  })

  it("returns null for nothing and for nonsense", () => {
    expect(parseColor("")).toBeNull()
    expect(parseColor(null)).toBeNull()
    expect(parseColor("rgb(1)")).toBeNull()
    expect(parseColor("#12")).toBeNull()
  })
})

describe("hsva", () => {
  it("round-trips a colour through hsv and back", () => {
    for (const hex of ["#1821fb", "#7ee787", "#ff7b72", "#123456"]) {
      expect(toHex(hsvaToRgba(rgbaToHsva(parseColor(hex)!, null)))).toBe(hex)
    }
  })

  it("keeps the previous hue through grey and the previous saturation through black", () => {
    expect(rgbaToHsva(parseColor("#808080")!, { h: 200, s: 0.4 }).h).toBe(200)
    expect(rgbaToHsva(parseColor("#000000")!, { h: 200, s: 0.4 })).toMatchObject({ h: 200, s: 0.4, v: 0 })
    expect(rgbaToHsva(parseColor("#808080")!, null).h).toBe(0)
  })

  it("prints hex, rgb and hsl, with alpha only when asked and present", () => {
    const hsva = rgbaToHsva(parseColor("#ff000080")!, null)
    expect(formatColor(hsva, "hex", false)).toBe("#ff0000")
    expect(formatColor(hsva, "hex", true)).toBe("#ff000080")
    expect(formatColor(hsva, "rgb", true)).toBe("rgba(255, 0, 0, 0.5)")
    expect(formatColor(hsva, "hsl", false)).toBe("hsl(0, 100%, 50%)")
  })
})
