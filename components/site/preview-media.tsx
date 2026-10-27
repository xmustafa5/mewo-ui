"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const motionAllowed = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !connection?.saveData
}

export const pascal = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

/**
 * An item's poster, and its short clip while something hovers or focuses it: the media every card of an item
 * shares. Nothing runs until `start`; the clip is not even requested before then, and `stop` pauses it. Both
 * themes' posters are in the markup and CSS shows the right one, so the first paint is correct before any script.
 * Without a poster, a placeholder names the item.
 */
export function usePreviewClip(name: string, hasPreview: boolean, className?: string) {
  const { resolvedTheme } = useTheme()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const stem = `/previews/${name}-${theme}`

  const start = () => {
    if (!hasPreview || !motionAllowed()) return
    if (!mounted) setMounted(true)
    else videoRef.current?.play().catch(() => {})
  }
  const stop = () => {
    videoRef.current?.pause()
    setPlaying(false)
  }

  const media = hasPreview ? (
    <>
      <Image src={`/previews/${name}-light.webp`} alt="" width={640} height={360} unoptimized className={cn("size-full object-cover dark:hidden", className)} />
      <Image src={`/previews/${name}-dark.webp`} alt="" width={640} height={360} unoptimized className={cn("hidden size-full object-cover dark:block", className)} />
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
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", playing ? "opacity-100" : "opacity-0")}
        >
          <source src={`${stem}.webm`} type="video/webm" />
          <source src={`${stem}.mp4`} type="video/mp4" />
        </video>
      ) : null}
    </>
  ) : (
    <div aria-hidden className="grid size-full place-items-center bg-dots">
      <span className="font-mono text-xs text-muted-foreground/70">{`<${pascal(name)} />`}</span>
    </div>
  )

  return { start, stop, media }
}
