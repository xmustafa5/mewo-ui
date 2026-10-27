"use client"

import * as React from "react"
import { CornerWordmark } from "@/registry/mewo/ui/corner-wordmark"

/** Shown and hidden in turn, as when a reader scrolls away from the top and back. Its state lives here so the demo
 * module stays server-safe. */
export function CornerWordmarkToggle() {
  const [show, setShow] = React.useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setShow((s) => !s), show ? 2400 : 1200)
    return () => clearTimeout(timer)
  }, [show])
  return <CornerWordmark show={show} onHome={() => setShow(false)} />
}
