"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export const PAGE_SOUND = "/sounds/meow.mp3"

/**
 * A short meow each time the site moves to another page. Not on the first load, and not inside a framed preview
 * (a piece's Customize frame, a site in the viewer), which would otherwise answer the page around it.
 */
export function PageSound() {
  const pathname = usePathname()
  const audio = useRef<HTMLAudioElement | null>(null)
  const last = useRef(pathname)

  // loaded once, so the first page change plays at once
  useEffect(() => {
    if (window.self !== window.top) return
    const sound = new Audio(PAGE_SOUND)
    sound.preload = "auto"
    sound.volume = 0.5
    audio.current = sound
    return () => {
      audio.current = null
    }
  }, [])

  useEffect(() => {
    if (last.current === pathname) return
    last.current = pathname
    const sound = audio.current
    if (!sound) return
    sound.currentTime = 0
    // a browser that hasn't seen a click or key on the page yet refuses to play; the page stays quiet
    sound.play().catch(() => {})
  }, [pathname])

  return null
}
