"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** The bordered pill a toolbar group sits in. */
export const groupClass = "flex h-9 items-center gap-0.5 rounded-xl border bg-card/60 p-1"

/** A flat icon button inside a group. */
export const segmentClass =
  "inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"

/** A stand-alone bordered button. */
export const toolClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl border bg-card/60 px-3 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"

export const brandButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-sm font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-[filter] outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-background px-1.5 font-mono text-[11px] text-muted-foreground">{children}</kbd>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-4.5 animate-spin rounded-full border-[1.5px] border-foreground/20 border-t-foreground motion-reduce:animate-[spin_2.4s_linear_infinite]",
        className,
      )}
    />
  )
}

export type TrackOption<T extends string | number> = {
  value: T
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

/**
 * A segmented control with a sliding highlight. Every segment gets an equal share of the width, so the
 * highlight is pure CSS: no measuring, no layout effect.
 */
export function Track<T extends string | number>({
  label,
  value,
  options,
  onChange,
  iconOnly = false,
  className,
}: {
  label: string
  value: T
  options: TrackOption<T>[]
  onChange: (value: T) => void
  iconOnly?: boolean
  className?: string
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const count = Math.max(options.length, 1)
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative grid h-9 rounded-xl border bg-card/60 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-[left] duration-200 ease-out motion-reduce:transition-none dark:bg-accent"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          left: `calc(0.25rem + (100% - 0.5rem) * ${index} / ${count})`,
        }}
      />
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            title={iconOnly ? option.label : undefined}
            aria-label={iconOnly ? option.label : undefined}
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 inline-flex h-7 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon aria-hidden /> : null}
            {iconOnly ? null : option.label}
          </button>
        )
      })}
    </div>
  )
}

export function IconButton({
  label,
  hint,
  icon: Icon,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & { label: string; hint?: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={hint ? `${label} (${hint})` : label}
      className={cn(segmentClass, "w-7 px-0", className)}
      {...props}
    >
      <Icon aria-hidden />
    </button>
  )
}
