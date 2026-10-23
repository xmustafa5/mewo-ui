"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { CatalogEntry } from "./catalog-filter"

const motionAllowed = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !connection?.saveData
}

const pascal = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

/**
 * A catalog card: a poster of the component, and a short clip of it in motion while the card is hovered or
 * focused. Nothing runs until then. The clip is not even requested before the first hover, and it pauses
 * when the pointer leaves. Both themes' posters are in the markup and CSS shows the right one, so the first
 * paint is correct before any script runs.
 */
export function PreviewCard({ entry, badge }: { entry: CatalogEntry; badge?: string }) {
  const { resolvedTheme } = useTheme()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const stem = `/previews/${entry.name}-${theme}`

  const start = () => {
    if (!entry.hasPreview || !motionAllowed()) return
    if (!mounted) setMounted(true)
    else videoRef.current?.play().catch(() => {})
  }

  const stop = () => {
    videoRef.current?.pause()
    setPlaying(false)
  }

  return (
    <Link
      href={`/docs/${entry.name}`}
      data-slot="preview-card"
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group block rounded-2xl bg-card/60 p-1.5 ring-1 ring-border transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-border/60">
        {entry.hasPreview ? (
          <>
            <Image
              src={`/previews/${entry.name}-light.webp`}
              alt=""
              width={640}
              height={360}
              unoptimized
              className="size-full object-cover dark:hidden"
            />
            <Image
              src={`/previews/${entry.name}-dark.webp`}
              alt=""
              width={640}
              height={360}
              unoptimized
              className="hidden size-full object-cover dark:block"
            />
            {mounted ? (
              <video
                key={stem}
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onPlaying={() => setPlaying(true)}
                aria-hidden
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-300",
                  playing ? "opacity-100" : "opacity-0",
                )}
              >
                <source src={`${stem}.webm`} type="video/webm" />
                <source src={`${stem}.mp4`} type="video/mp4" />
              </video>
            ) : null}
          </>
        ) : (
          <div aria-hidden className="grid size-full place-items-center bg-dots">
            <span className="font-mono text-xs text-muted-foreground/70">{`<${pascal(entry.name)} />`}</span>
          </div>
        )}
        {badge ? (
          <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-brand px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.06em] text-brand-foreground uppercase shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-2.5 pt-3 pb-2">
        <h3 className="text-[14.5px] leading-tight font-semibold tracking-[-0.015em] transition-colors group-hover:text-brand-text">
          {entry.title}
        </h3>
        <p className="mt-1.5 text-[11px] font-medium tracking-[0.05em] text-muted-foreground uppercase">
          {entry.groupLabel}
        </p>
      </div>
    </Link>
  )
}
