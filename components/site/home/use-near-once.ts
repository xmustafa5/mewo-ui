"use client"

import * as React from "react"

/** Becomes true the first time the element comes within `margin` of the viewport, and stays true. */
export function useNearOnce(margin: string) {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const [near, setNear] = React.useState(false)

  React.useEffect(() => {
    if (!node || near) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin: margin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, near, margin])

  return [setNode, near] as const
}
