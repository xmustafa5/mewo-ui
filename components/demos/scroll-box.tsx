"use client"

import * as React from "react"

// A demo's own scroll box that opens part-way into its scroll, where the piece already shows something, rather than
// on the blank moment before it starts. `start` is in box heights, as the stage frame's counter reads, and is read
// once, as the box mounts: a later change (a control the start follows) leaves the reader's place alone.
export function ScrollBox({ start = 0, ...props }: React.ComponentProps<"div"> & { start?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [initial] = React.useState(start)
  // a layout effect runs before the piece's own effects read the scroll, so it starts there without a jump
  React.useLayoutEffect(() => {
    const el = ref.current
    if (el && initial) el.scrollTop = initial * el.clientHeight
  }, [initial])
  return <div ref={ref} {...props} />
}
