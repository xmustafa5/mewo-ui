export type SizePreset = { value: string; label: string; width?: number; height?: number }

export const SIZE_PRESETS: SizePreset[] = [
  { value: "stage", label: "Match preview" },
  { value: "desktop", label: "Desktop", width: 1920, height: 1080 },
  { value: "laptop", label: "Laptop", width: 1440, height: 900 },
  { value: "mobile", label: "Mobile", width: 390, height: 844 },
  { value: "square", label: "Square", width: 1080, height: 1080 },
  { value: "portrait", label: "Portrait", width: 1080, height: 1350 },
  { value: "story", label: "Story", width: 1080, height: 1920 },
  { value: "og", label: "Social card", width: 1200, height: 630 },
  { value: "banner", label: "X header", width: 1500, height: 500 },
  { value: "custom", label: "Custom" },
]

export const SCALES = [1, 2, 3] as const

export const MAX_IMAGE_SIDE = 8192
export const MAX_VIDEO_SIDE = 4096

export type Layout = { width: number; height: number }

export function resolveLayout(sizeKey: string, custom: Layout, stage: Layout | null): Layout {
  if (sizeKey === "stage") {
    return {
      width: Math.max(64, Math.round(stage?.width || 1280)),
      height: Math.max(64, Math.round(stage?.height || 720)),
    }
  }
  if (sizeKey === "custom") {
    return {
      width: Math.min(Math.max(64, Math.round(custom.width) || 1280), 4096),
      height: Math.min(Math.max(64, Math.round(custom.height) || 720), 4096),
    }
  }
  const preset = SIZE_PRESETS.find((item) => item.value === sizeKey && item.width) ?? SIZE_PRESETS[1]
  return { width: preset.width as number, height: preset.height as number }
}

/** Scales a layout up by `scale` but never past `limit` on its longest side. Video needs even sizes, hence `round`. */
export function fitOutput(layout: Layout, scale: number, limit: number, round: (n: number) => number = Math.round) {
  const longest = Math.max(layout.width, layout.height)
  const ratio = longest * scale > limit ? limit / longest : scale
  return { width: round(layout.width * ratio), height: round(layout.height * ratio), ratio }
}

export const even = (value: number) => Math.max(2, Math.round(value / 2) * 2)

export const sizeLabel = (preset: SizePreset) =>
  preset.width ? `${preset.label} · ${preset.width} × ${preset.height}` : preset.label
