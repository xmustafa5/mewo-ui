"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { Check, Copy, Minus, Pipette, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ColorFormat, type HSVA, type RGBA, clamp, formatColor, hsvaToRgba, parseColor, rgbaToHsva, toHex } from "./color"
import { labelClass, trackClass } from "./controls"

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
  }
}

const SWATCHES = ["#1821fb", "#7c3aed", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444", "#ec4899", "#f43f5e", "#ffffff", "#94a3b8", "#000000"]
const FORMATS: ColorFormat[] = ["hex", "rgb", "hsl"]
const FORMAT_LABELS: Record<ColorFormat, string> = { hex: "Hex", rgb: "RGB", hsl: "HSL" }
const RECENT_KEY = "mewo:customize:colors"
const RECENT_MAX = 10
const FALLBACK: RGBA = { r: 0.094, g: 0.129, b: 0.984, a: 1 }
/** The checkerboard under a translucent colour. */
const CHECKER = "repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px"

/** The format shows the same in every picker on the page. */
let sharedFormat: ColorFormat = "hex"

const readRecent = (): string[] => {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === "string").slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}
const writeRecent = (value: string) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([value, ...readRecent().filter((item) => item !== value)].slice(0, RECENT_MAX)))
  } catch {
    // storage may be off; the list is a convenience
  }
}

const stepFor = (event: React.KeyboardEvent) => (event.shiftKey ? 10 : 1)
const swatchStyle = (color: string, translucent: boolean): React.CSSProperties => ({
  background: translucent ? `linear-gradient(${color}, ${color}), ${CHECKER}` : color,
})

/** Pointer handling for the saturation area and the two strips: the position in the box, 0–1 on each axis. */
function useDrag(ref: React.RefObject<HTMLElement | null>, onValue: (point: { x: number; y: number }) => void) {
  const active = React.useRef(false)
  const read = (event: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    return { x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1)), y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1)) }
  }
  const stop = () => {
    active.current = false
  }
  return {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      active.current = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
      event.currentTarget.focus({ preventScroll: true })
      onValue(read(event))
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (active.current) onValue(read(event))
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
  }
}

/** A number field for one channel: typed values commit on blur or Enter, the arrows step (Shift: by ten). */
function Channel({ label, value, min, max, suffix, onCommit }: { label: string; value: number; min: number; max: number; suffix?: string; onCommit: (value: number) => void }) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const shown = draft ?? String(value)
  const commit = (text: string) => {
    const parsed = parseFloat(text)
    if (Number.isFinite(parsed)) onCommit(clamp(parsed, min, max))
  }
  return (
    <label className="flex min-w-0 flex-1 flex-col items-center gap-0.75">
      <input
        inputMode="decimal"
        value={shown}
        aria-label={label}
        className={fieldClass}
        onFocus={(event) => {
          setDraft(String(value))
          event.target.select()
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          commit(shown)
          setDraft(null)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit(shown)
            event.currentTarget.select()
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault()
            const next = clamp((parseFloat(shown) || 0) + (event.key === "ArrowUp" ? 1 : -1) * stepFor(event), min, max)
            setDraft(String(next))
            onCommit(next)
          }
        }}
      />
      <span className="text-[10.5px] leading-none font-medium text-muted-foreground">
        {label}
        {suffix}
      </span>
    </label>
  )
}

const fieldClass =
  "h-7.5 w-full min-w-0 rounded-lg bg-foreground/6 px-1.5 text-center text-[12.5px] text-foreground tabular-nums outline-none select-text focus:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50"
const toolClass =
  "inline-flex h-7.5 shrink-0 items-center justify-center rounded-lg bg-foreground/6 text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-foreground/10 hover:text-foreground active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring/60"
const thumbClass = "pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_1px_4px_rgba(0,0,0,0.35)]"
const stripClass = "relative h-3 cursor-pointer rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-ring/60"

/**
 * The picker itself: a saturation and brightness area, a hue strip, an opacity strip when `alpha`, the value in
 * hex, RGB or HSL, swatches, the colours picked lately and the eyedropper where the browser has one. Hue and
 * saturation are remembered apart from the colour, so a grey or black keeps its place on the strips.
 */
function Picker({ value, alpha, onChange }: { value: string; alpha: boolean; onChange: (hex: string) => void }) {
  const [memory, setMemory] = React.useState<{ h: number; s: number } | null>(null)
  const [format, setFormatState] = React.useState<ColorFormat>(sharedFormat)
  const [hexDraft, setHexDraft] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [recent] = React.useState(readRecent)
  const areaRef = React.useRef<HTMLDivElement>(null)
  const hueRef = React.useRef<HTMLDivElement>(null)
  const alphaRef = React.useRef<HTMLDivElement>(null)

  const hsva = rgbaToHsva(parseColor(value) ?? FALLBACK, memory)
  const rgba = hsvaToRgba(hsva)
  const output = toHex(rgba, alpha)
  const opaque = toHex({ ...rgba, a: 1 })
  const hueColor = toHex(hsvaToRgba({ h: hsva.h, s: 1, v: 1, a: 1 }))
  const hasDropper = typeof window !== "undefined" && "EyeDropper" in window

  const commit = (next: HSVA) => {
    const clamped = { h: clamp(next.h, 0, 360), s: clamp(next.s), v: clamp(next.v), a: alpha ? clamp(next.a) : 1 }
    setMemory({ h: clamped.h, s: clamped.s })
    const hex = toHex(hsvaToRgba(clamped), alpha)
    if (hex !== output) onChange(hex)
  }
  const commitColor = (color: RGBA) => commit(rgbaToHsva({ ...color, a: alpha ? color.a : 1 }, hsva))
  const setFormat = (next: ColorFormat) => {
    sharedFormat = next
    setFormatState(next)
  }

  const areaDrag = useDrag(areaRef, ({ x, y }) => commit({ ...hsva, s: x, v: 1 - y }))
  const hueDrag = useDrag(hueRef, ({ x }) => commit({ ...hsva, h: x * 360 }))
  const alphaDrag = useDrag(alphaRef, ({ x }) => commit({ ...hsva, a: x }))

  const onAreaKey = (event: React.KeyboardEvent) => {
    const step = stepFor(event) / 100
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key]
    if (!move) return
    event.preventDefault()
    commit({ ...hsva, s: hsva.s + move[0], v: hsva.v + move[1] })
  }
  const onStripKey = (event: React.KeyboardEvent, key: "h" | "a", scale: number) => {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key]
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    const next = event.key === "Home" ? 0 : event.key === "End" ? scale : hsva[key] + ((delta ?? 0) * stepFor(event) * scale) / 100
    commit({ ...hsva, [key]: key === "h" ? clamp(next, 0, 360) : clamp(next) })
  }

  const pick = async () => {
    try {
      const result = await new window.EyeDropper!().open()
      const picked = parseColor(result.sRGBHex)
      if (picked) commitColor({ ...picked, a: hsva.a })
    } catch {
      // the user closed the dropper
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatColor(hsva, format, alpha))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }
  const applyText = (text: string) => {
    const parsed = parseColor(text)
    if (parsed) commitColor(parsed)
  }

  const hsl = (() => {
    const max = Math.max(rgba.r, rgba.g, rgba.b)
    const min = Math.min(rgba.r, rgba.g, rgba.b)
    const l = (max + min) / 2
    const d = max - min
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
    return { h: Math.round(hsva.h), s: Math.round(clamp(s) * 100), l: Math.round(l * 100) }
  })()

  return (
    <div className="flex flex-col gap-2.5 select-none">
      <div
        ref={areaRef}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsva.v * 100)}
        aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
        className="relative h-38 cursor-crosshair touch-none rounded-[9px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        style={{ background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hueColor})` }}
        onKeyDown={onAreaKey}
        {...areaDrag}
      >
        <span className={thumbClass} style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: opaque }} />
      </div>

      <div className="flex items-center gap-2.5">
        {hasDropper ? (
          <button type="button" className={cn(toolClass, "w-7.5")} aria-label="Pick a colour from the screen" onClick={pick}>
            <Pipette className="size-4" aria-hidden />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div
            ref={hueRef}
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsva.h)}
            className={cn(stripClass, "touch-none")}
            style={{ background: "linear-gradient(to right, #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00 100%)" }}
            onKeyDown={(event) => onStripKey(event, "h", 360)}
            {...hueDrag}
          >
            <span className={cn(thumbClass, "top-1/2")} style={{ left: `${(hsva.h / 360) * 100}%`, background: hueColor }} />
          </div>
          {alpha ? (
            <div
              ref={alphaRef}
              role="slider"
              tabIndex={0}
              aria-label="Opacity"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(hsva.a * 100)}
              className={cn(stripClass, "touch-none")}
              style={{ background: CHECKER }}
              onKeyDown={(event) => onStripKey(event, "a", 1)}
              {...alphaDrag}
            >
              <span className="absolute inset-0 rounded-[inherit]" style={{ background: `linear-gradient(to right, transparent, ${opaque})` }} />
              <span className={cn(thumbClass, "top-1/2")} style={{ left: `${hsva.a * 100}%`, ...swatchStyle(output, hsva.a < 1) }} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className={cn(toolClass, "min-w-10.5 px-2 text-xs font-medium")}
          aria-label={`Colour format: ${FORMAT_LABELS[format]}. Change format`}
          onClick={() => setFormat(FORMATS[(FORMATS.indexOf(format) + 1) % FORMATS.length])}
        >
          {FORMAT_LABELS[format]}
        </button>
        {format === "hex" ? (
          <label className="flex min-w-0 flex-3 flex-col items-center gap-0.75">
            <input
              value={hexDraft ?? toHex(rgba)}
              spellCheck={false}
              autoComplete="off"
              aria-label="Hex"
              className={fieldClass}
              onFocus={(event) => {
                setHexDraft(toHex(rgba))
                event.target.select()
              }}
              onChange={(event) => setHexDraft(event.target.value)}
              onBlur={() => {
                applyText(hexDraft ?? "")
                setHexDraft(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyText(hexDraft ?? "")
                  setHexDraft(null)
                  event.currentTarget.select()
                }
              }}
            />
            <span className="text-[10.5px] leading-none font-medium text-muted-foreground">Hex</span>
          </label>
        ) : null}
        {format === "rgb"
          ? (["r", "g", "b"] as const).map((key) => <Channel key={key} label={key.toUpperCase()} value={Math.round(rgba[key] * 255)} min={0} max={255} onCommit={(next) => commitColor({ ...rgba, [key]: next / 255 })} />)
          : null}
        {format === "hsl" ? (
          <>
            <Channel label="H" value={hsl.h} min={0} max={360} onCommit={(next) => commit({ ...hsva, h: next })} />
            <Channel label="S" value={hsl.s} min={0} max={100} onCommit={(next) => commitColor({ ...(parseColor(`hsl(${hsl.h}, ${next}%, ${hsl.l}%)`) ?? rgba), a: hsva.a })} />
            <Channel label="L" value={hsl.l} min={0} max={100} onCommit={(next) => commitColor({ ...(parseColor(`hsl(${hsl.h}, ${hsl.s}%, ${next}%)`) ?? rgba), a: hsva.a })} />
          </>
        ) : null}
        {alpha ? <Channel label="A" suffix=" %" value={Math.round(hsva.a * 100)} min={0} max={100} onCommit={(next) => commit({ ...hsva, a: Math.round(next * 10) / 1000 })} /> : null}
        <button type="button" className={cn(toolClass, "w-7.5")} aria-label={copied ? "Copied" : "Copy colour"} onClick={copy}>
          {copied ? <Check className="size-3.75" aria-hidden /> : <Copy className="size-3.75" aria-hidden />}
        </button>
      </div>

      <div role="group" aria-label="Swatches" className="grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-1.5">
        {SWATCHES.map((swatch) => (
          <SwatchButton key={swatch} color={swatch} pressed={toHex(rgba) === swatch} onClick={() => commitColor({ ...parseColor(swatch)!, a: hsva.a })} />
        ))}
      </div>

      {recent.length ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium text-muted-foreground">Recent</span>
          <div role="group" aria-label="Recent colours" className="grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-1.5">
            {recent.map((item) => (
              <SwatchButton
                key={item}
                color={item}
                pressed={output === item}
                onClick={() => {
                  const parsed = parseColor(item)
                  if (parsed) commitColor(parsed)
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SwatchButton({ color, pressed, onClick }: { color: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={color}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "aspect-square cursor-pointer rounded-md shadow-[inset_0_0_0_1px_rgba(127,127,127,0.28)] transition-transform duration-100 hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring/60",
        pressed && "shadow-[inset_0_0_0_1px_rgba(127,127,127,0.28),0_0_0_2px_var(--popover),0_0_0_3.5px_var(--foreground)]",
      )}
      style={swatchStyle(color, color.length > 7)}
    />
  )
}

const popupClass =
  "w-[min(var(--anchor-width),320px)] min-w-[260px] origin-(--transform-origin) rounded-[14px] border bg-popover p-2.5 text-popover-foreground shadow-xl shadow-black/15 transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"

/** The picker in a popover under its trigger; the colour it opened with is kept in the recent list when it closes changed. */
function PickerPopover({
  label,
  value,
  alpha,
  open,
  onOpenChange,
  onChange,
  children,
}: {
  label: string
  value: string
  alpha: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (hex: string) => void
  children: React.ReactNode
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      {children}
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <Popover.Popup aria-label={`${label} colour`} className={popupClass}>
            <Picker value={value} alpha={alpha} onChange={onChange} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Opens and closes the picker, and remembers a colour that changed while it was open. */
function usePickerOpen(value: string) {
  const [open, setOpen] = React.useState(false)
  const [openedWith, setOpenedWith] = React.useState<string | null>(null)
  const onOpenChange = (next: boolean) => {
    if (next) setOpenedWith(value)
    else if (openedWith !== null && openedWith !== value) writeRecent(value)
    setOpen(next)
  }
  return { open, onOpenChange }
}

/** A colour: the row shows a swatch and the hex, which can be typed over; the row opens the picker. */
export function Color({ label, value, alpha = false, onChange }: { label: string; value: string; alpha?: boolean; onChange: (hex: string) => void }) {
  const output = toHex(parseColor(value) ?? FALLBACK, alpha)
  const translucent = alpha && (parseColor(value)?.a ?? 1) < 1
  const [draft, setDraft] = React.useState<string | null>(null)
  const { open, onOpenChange } = usePickerOpen(output)
  const apply = (text: string) => {
    const parsed = parseColor(text)
    if (parsed) onChange(toHex({ ...parsed, a: alpha ? parsed.a : 1 }, alpha))
  }

  return (
    <PickerPopover label={label} value={output} alpha={alpha} open={open} onOpenChange={onOpenChange} onChange={onChange}>
      <div data-control className={cn(trackClass, "cursor-pointer")}>
        <Popover.Trigger className="absolute inset-0 z-3 rounded-[inherit] text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring/60" aria-label={`${label}: ${output}`}>
          <span className={labelClass}>{label}</span>
        </Popover.Trigger>
        <div className="absolute top-1/2 right-2.5 z-5 flex -translate-y-1/2 items-center gap-1.5">
          <span aria-hidden className="pointer-events-none size-6 shrink-0 rounded-md border border-border" style={swatchStyle(output, translucent)} />
          <input
            type="text"
            value={draft ?? output}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${label} value`}
            className="h-6 w-21 rounded-md bg-foreground/6 px-2 text-xs lowercase text-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onFocus={(event) => {
              setDraft(output)
              event.target.select()
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              apply(draft ?? output)
              setDraft(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                apply(draft ?? output)
                setDraft(null)
                event.currentTarget.select()
              } else if (event.key === "Escape") {
                setDraft(null)
                event.currentTarget.blur()
              }
            }}
          />
        </div>
      </div>
    </PickerPopover>
  )
}

/** One colour of a palette: a chip that opens the picker. */
function Chip({ label, value, onChange, className }: { label: string; value: string; onChange: (hex: string) => void; className?: string }) {
  const output = toHex(parseColor(value) ?? FALLBACK)
  const { open, onOpenChange } = usePickerOpen(output)
  return (
    <PickerPopover label={label} value={output} alpha={false} open={open} onOpenChange={onOpenChange} onChange={onChange}>
      <Popover.Trigger
        aria-label={`${label}: ${output}`}
        className={cn(
          "h-full w-full min-w-0 flex-1 cursor-pointer shadow-[inset_0_0_0_1px_rgba(127,127,127,0.2)] transition-[transform,box-shadow] duration-150 hover:shadow-[inset_0_0_0_1px_rgba(127,127,127,0.5)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60",
          className,
        )}
        style={{ background: output }}
      />
    </PickerPopover>
  )
}

const FRESH = ["#1821fb", "#40ffaa", "#4079ff", "#ffd93d", "#ff6b6b", "#06b6d4", "#f97316", "#ec4899", "#a3e635"]

/** A list of colours: a strip of chips, with a colour added or taken off at the end. Takes two rows of the grid. */
export function ColorList({ label = "Colours", colors, min = 2, max = 8, onChange }: { label?: string; colors: string[]; min?: number; max?: number; onChange: (colors: string[]) => void }) {
  const update = (index: number, value: string) => onChange(colors.map((color, i) => (i === index ? value : color)))
  const add = () => {
    if (colors.length >= max) return
    const used = colors.map((color) => color.toLowerCase())
    onChange([...colors, FRESH.find((color) => !used.includes(color)) ?? colors[colors.length - 1]])
  }
  const remove = () => {
    if (colors.length > min) onChange(colors.slice(0, -1))
  }
  return (
    <div data-control className="row-span-2 flex flex-col gap-2 rounded-[7px] bg-foreground/4.5 px-2 pt-1.75 pb-2">
      <div className="flex min-h-6.5 items-center justify-between gap-2.5 pl-1">
        <span className="shrink-0 text-[13px] font-medium tracking-[0.01em] whitespace-nowrap text-muted-foreground">{label}</span>
        <div className="flex shrink-0 gap-0.5">
          <button type="button" aria-label="Remove a colour" onClick={remove} disabled={colors.length <= min} className={paletteButtonClass}>
            <Minus className="size-3.5" aria-hidden />
          </button>
          <button type="button" aria-label="Add a colour" onClick={add} disabled={colors.length >= max} className={paletteButtonClass}>
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex min-h-7.5 flex-1 gap-0.75">
        {colors.map((color, index) => (
          <Chip
            key={index}
            label={`${label} ${index + 1}`}
            value={color}
            onChange={(value) => update(index, value)}
            className={cn("rounded-[4px]", index === 0 && "rounded-l-[9px]", index === colors.length - 1 && "rounded-r-[9px]")}
          />
        ))}
      </div>
    </div>
  )
}

const paletteButtonClass =
  "grid size-6.5 cursor-pointer place-items-center rounded-[7px] text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-foreground/6 hover:text-foreground active:scale-[0.92] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60"
