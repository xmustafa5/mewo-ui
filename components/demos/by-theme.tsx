"use client"

import * as React from "react"
import { useTheme } from "next-themes"

const subscribe = () => () => {}

/**
 * Renders `light` in the light theme and `dark` otherwise. A background tuned for one page colour reads
 * wrong on the other, so a demo passes one configuration per theme. Until the theme is known on the client
 * the dark one renders, which is what the server sends. Both are the same component in the same place, so
 * a theme switch only changes its props; nothing remounts.
 */
export function ByTheme({ dark, light }: { dark: React.ReactNode; light: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return <>{mounted && resolvedTheme === "light" ? light : dark}</>
}
