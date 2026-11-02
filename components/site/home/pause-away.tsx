"use client"

import * as React from "react"

/**
 * Pauses every CSS animation inside while the block is more than a screen away from the viewport
 * (`[data-away]` in globals.css does the pausing). Chrome composites an animation only once it has
 * painted its element, and it paints about one screen around the viewport: any farther, a running
 * animation is stepped on the main thread every frame, for nothing anyone can see, and on a page this
 * long each of those frames costs a quarter of a core.
 */
export function PauseAway({ margin = "100%", ...props }: React.ComponentProps<"div"> & { margin?: string }) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const [away, setAway] = React.useState(false)

  React.useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), { rootMargin: margin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, margin])

  return <div ref={setNode} data-away={away ? "" : undefined} {...props} />
}
