"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrub } from "./use-scrub"

/*
 * The Customize panel's rows. Each is one 40px row with its label on the left and its value on the right, and
 * each carries `data-control` so the panel's grid gives it one cell (anything else spans the row).
 */

export const trackClass =
  "relative h-10 w-full overflow-hidden rounded-[7px] border border-transparent bg-foreground/4.5 text-left outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-35"
export const labelClass = "pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[13px] font-medium tracking-[0.01em] whitespace-nowrap text-muted-foreground"
export const valueClass = "pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-[13px] font-medium text-foreground tabular-nums"

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const decimalsOf = (step: number) => {
  const text = step.toString()
  const dot = text.indexOf(".")
  return dot === -1 ? 0 : text.length - dot - 1
}
const roundToStep = (value: number, step: number, min: number) => {
  const raw = Math.round((value - min) / step) * step + min
  return Number(raw.toFixed(Math.max(decimalsOf(step), decimalsOf(min))))
}

const HOVER_QUERY = "(hover: hover) and (pointer: fine)"
const subscribeHover = (onChange: () => void) => {
  const query = window.matchMedia(HOVER_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
/** Whether a pointer can hover: only then does hovering a slider show its thumb. */
const useHoverDevice = () =>
  React.useSyncExternalStore(
    subscribeHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  )

const TICKS = 9

/** A number: scrub anywhere on the row, or use the arrow keys, Home and End. */
export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  unit = "",
  format,
  disabled = false,
  onChange,
}: {
  label: string
  min?: number
  max?: number
  step?: number
  value: number
  /** Printed after the value: `s`, `px`, `%`. */
  unit?: string
  /** Prints the value another way, in place of the number and unit. */
  format?: (value: number) => string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = React.useState(false)
  const hoverDevice = useHoverDevice()
  const range = max - min
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0

  const computeValue = React.useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value
      const rect = track.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1)
      return clamp(roundToStep(min + ratio * range, step, min), min, max)
    },
    [min, max, step, range, value],
  )

  const { dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useScrub({ trackRef, computeValue, onChange, disabled })
  const active = dragging || (hoverDevice && hovering)

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    const next = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      Home: min,
      End: max,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(clamp(roundToStep(next, step, min), min, max))
  }

  const shown = format ? format(value) : `${Number(value.toFixed(decimalsOf(step)))}${unit}`

  return (
    <div
      ref={trackRef}
      data-control
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={shown}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      data-active={active}
      className={cn(trackClass, "cursor-pointer touch-pan-y")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={onKeyDown}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 rounded-[7px] bg-foreground/7" style={{ width: `${percentage}%` }} />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: TICKS }, (_, index) => (
          <i key={index} className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-border" style={{ left: `${((index + 1) / (TICKS + 1)) * 100}%` }} />
        ))}
      </div>
      <div className="pointer-events-none absolute top-1/2 z-3 -ml-1.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${percentage}%` }}>
        <div className={cn("h-6.5 w-1.25 scale-70 rounded-full bg-foreground opacity-30 transition-[opacity,transform] duration-200 ease-out", active && "scale-100 opacity-90")} />
      </div>
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{shown}</span>
    </div>
  )
}

export type Option<T extends string = string> = T | { value: T; label: string }

const titleCase = (text: string) => text.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
const toItems = <T extends string>(options: readonly Option<T>[]) => options.map((option) => (typeof option === "string" ? { value: option, label: titleCase(option) } : option))

/** One of a few: the row opens a list. */
export function Select<T extends string>({ label, options, value, disabled = false, onChange }: { label: string; options: readonly Option<T>[]; value: T; disabled?: boolean; onChange: (value: T) => void }) {
  const items = React.useMemo(() => toItems(options), [options])
  return (
    // the row is a wrapper: the root also renders a hidden form field, which must not take a grid cell
    <div data-control>
      <SelectPrimitive.Root items={items} value={value} onValueChange={(next) => next !== null && onChange(next)} disabled={disabled}>
        <SelectPrimitive.Trigger aria-label={label} data-disabled={disabled} className={cn(trackClass, "flex cursor-pointer items-center transition-transform duration-100 active:scale-[0.985]")}>
          <span className={labelClass}>{label}</span>
          <span className="pointer-events-none absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center gap-1.5">
            <SelectPrimitive.Value className="text-[13px] text-foreground" />
            <SelectPrimitive.Icon className="text-muted-foreground transition-transform duration-200 data-popup-open:rotate-180">
              <ChevronDown className="size-3.5" aria-hidden />
            </SelectPrimitive.Icon>
          </span>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner alignItemWithTrigger={false} sideOffset={4} className="z-50 outline-none">
            <SelectPrimitive.Popup className="w-(--anchor-width) origin-top rounded-[7px] border bg-popover p-1 text-popover-foreground shadow-xl shadow-black/10 transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0">
              <SelectPrimitive.List className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <SelectPrimitive.Item
                    key={item.value}
                    value={item.value}
                    className="cursor-pointer rounded-md px-3 py-2 text-[13px] text-muted-foreground outline-none transition-colors data-highlighted:bg-accent data-highlighted:text-foreground data-selected:text-foreground"
                  >
                    <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}

/** On or off. */
export function Switch({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  const toggle = () => {
    if (!disabled) onChange(!checked)
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-control
      data-disabled={disabled}
      data-checked={checked}
      tabIndex={disabled ? -1 : 0}
      className={cn(trackClass, "flex cursor-pointer items-center transition-transform duration-100 active:scale-[0.985]")}
      onClick={toggle}
    >
      <span className={labelClass}>{label}</span>
      <span
        aria-hidden
        className={cn("absolute top-1/2 right-3 z-10 h-5 w-9 -translate-y-1/2 rounded-full border border-foreground/10 bg-foreground/10 transition-colors duration-200", checked && "border-brand bg-brand")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-3.5 rounded-full bg-foreground/70 shadow-sm transition-[transform,background-color] duration-200 ease-out", checked && "translate-x-4 bg-white")} />
      </span>
    </button>
  )
}

/** Free text. */
export function Input({
  label,
  value,
  placeholder = "",
  maxLength,
  disabled = false,
  wide = false,
  showEnd = false,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  /** The field has a whole row to itself: its text may start just after the label, not 40% of the way along. */
  wide?: boolean
  /** A value too long for the field shows its end, flush right like every row's value, while it isn't being edited:
   * the end of an address is what tells one from another. */
  showEnd?: boolean
  onChange: (value: string) => void
}) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useLayoutEffect(() => {
    const input = ref.current
    if (!showEnd || !input) return
    const toEnd = () => {
      if (document.activeElement !== input) input.scrollLeft = input.scrollWidth
    }
    // the browser scrolls a field back to its start as it loses focus, so the end is shown on the next frame
    let frame = 0
    const onBlur = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(toEnd)
    }
    toEnd()
    const resize = new ResizeObserver(toEnd)
    resize.observe(input)
    input.addEventListener("blur", onBlur)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      input.removeEventListener("blur", onBlur)
    }
  }, [showEnd, value])
  return (
    <label data-control data-disabled={disabled} className={cn(trackClass, "block cursor-text")}>
      <span className={labelClass}>{label}</span>
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-label={label}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "absolute inset-0 z-5 w-full bg-transparent pr-3 text-right text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60",
          wide ? "pl-28" : "pl-[40%]",
          // a cut start fades out where the text begins; an end that fits leaves the fade on empty space
          !showEnd ? "text-ellipsis" : wide ? "mask-[linear-gradient(to_right,transparent_7rem,black_9rem)]" : "mask-[linear-gradient(to_right,transparent_40%,black_calc(40%+2rem))]",
        )}
      />
    </label>
  )
}
