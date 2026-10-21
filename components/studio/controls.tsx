"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PropDefinition, Props, PropValue } from "./types"

const rowClass = "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-1.5"
const labelClass = "min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground"
const fieldClass =
  "h-8 rounded-lg border bg-background/60 px-2.5 text-[13px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

const format = (value: number, step: number) => {
  const decimals = Math.min(4, Math.max(0, -Math.floor(Math.log10(step || 1))))
  return value.toFixed(decimals)
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <label className={cn(rowClass, "flex-col items-stretch gap-1.5")}>
      <span className="flex items-center justify-between gap-3">
        <span className={labelClass}>{label}</span>
        <span className="font-mono text-xs text-foreground tabular-nums">
          {format(value, step)}
          {unit ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-accent accent-brand outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      />
    </label>
  )
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className={rowClass}>
      <span className={labelClass}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5.5 w-9.5 shrink-0 rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
          checked ? "border-brand bg-brand" : "border-border bg-accent",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
    </div>
  )
}

export type SelectOption = { value: string; label: string }

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly (string | SelectOption)[]
  onChange: (value: string) => void
}) {
  const items = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option))
  return (
    <label className={rowClass}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "max-w-[60%]")}
      >
        {items.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={rowClass}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "w-[55%] font-mono")}
      />
    </label>
  )
}

const HEX6 = /^#[0-9a-fA-F]{6}$/

/** `<input type="color">` only speaks six-digit hex; anything else gets a neutral swatch but keeps its text. */
const toInputHex = (value: string) => (HEX6.test(value) ? value : "#808080")

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className={rowClass}>
      <span className={labelClass}>{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="text"
          value={value}
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} hex`}
          onChange={(event) => onChange(event.target.value.trim())}
          className={cn(fieldClass, "w-24 font-mono")}
        />
        <span className="relative size-8 overflow-hidden rounded-lg border" style={{ background: value }}>
          <input
            type="color"
            value={toInputHex(value)}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
      </span>
    </div>
  )
}

export function ColorList({
  label,
  colors,
  min,
  max,
  onChange,
}: {
  label: string
  colors: string[]
  min: number
  max: number
  onChange: (value: string[]) => void
}) {
  const update = (index: number, value: string) => onChange(colors.map((color, i) => (i === index ? value : color)))
  const remove = (index: number) => onChange(colors.filter((_, i) => i !== index))
  const add = () => onChange([...colors, colors[colors.length - 1] ?? "#ffffff"])
  return (
    <div className={cn(rowClass, "flex-col items-stretch gap-2")}>
      <span className="flex items-center justify-between gap-3">
        <span className={labelClass}>{label}</span>
        <button
          type="button"
          aria-label={`Add ${label.toLowerCase()}`}
          disabled={colors.length >= max}
          onClick={add}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </span>
      <ul className="flex flex-col gap-1.5">
        {colors.map((color, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg border" style={{ background: color }}>
              <input
                type="color"
                value={toInputHex(color)}
                aria-label={`${label} ${index + 1}`}
                onChange={(event) => update(index, event.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </span>
            <input
              type="text"
              value={color}
              spellCheck={false}
              autoComplete="off"
              aria-label={`${label} ${index + 1} hex`}
              onChange={(event) => update(index, event.target.value.trim())}
              className={cn(fieldClass, "min-w-0 flex-1 font-mono")}
            />
            <button
              type="button"
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              disabled={colors.length <= min}
              onClick={() => remove(index)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PropControl({
  definition,
  value,
  onChange,
}: {
  definition: PropDefinition
  value: PropValue | undefined
  onChange: (name: string, value: PropValue) => void
}) {
  const { name, label } = definition
  const set = (next: PropValue) => onChange(name, next)
  switch (definition.type) {
    case "number":
      return (
        <Slider
          label={label}
          min={definition.min ?? 0}
          max={definition.max ?? 100}
          step={definition.step ?? 1}
          value={Number(value) || 0}
          onChange={set}
        />
      )
    case "boolean":
      return <Switch label={label} checked={Boolean(value)} onChange={set} />
    case "color":
      return <ColorPicker label={label} value={String(value ?? "")} onChange={set} />
    case "colorArray":
      return (
        <ColorList
          label={label}
          colors={Array.isArray(value) ? value : [String(value ?? "#ffffff")]}
          min={definition.minItems ?? 1}
          max={definition.maxItems ?? 8}
          onChange={set}
        />
      )
    case "select":
      return <Select label={label} options={definition.options ?? []} value={String(value ?? "")} onChange={set} />
    case "text":
      return <TextInput label={label} value={String(value ?? "")} onChange={set} />
  }
}

export function PropControls({
  definitions,
  props,
  onChange,
}: {
  definitions: PropDefinition[]
  props: Props
  onChange: (name: string, value: PropValue) => void
}) {
  return definitions.map((definition) => (
    <PropControl key={definition.name} definition={definition} value={props[definition.name]} onChange={onChange} />
  ))
}
