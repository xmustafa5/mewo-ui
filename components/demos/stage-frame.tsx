"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollStage, type StageTrackSet } from "@/registry/mewo/ui/scroll-stage"

// A demo frame for a piece of a scroll story: a 16:10 box that scrolls by itself, holding a ScrollStage that follows
// that scroll with the piece's slice of the story's desktop tracks, and the scroll position in the corner. The box is
// size-contained and layout-contained (a containing block for fixed pieces too, without a transform), so the stage's fixed layer, the pieces' container units and their size unit all
// follow the frame.
export function StageFrame({
  tracks,
  length,
  scale = 1,
  start = 0,
  className,
  children,
}: {
  /** The piece's tracks, sliced from the story and rebased to start at 0. */
  tracks: StageTrackSet
  /** The slice's length in viewport heights. */
  length: number
  /** The stage's width against the frame's, centred: above 1 the pieces show bigger, and only the middle of the
   * story's view is in the frame (for a small piece near the middle, like the timeline). */
  scale?: number
  /** Where the frame opens, in viewport heights of the slice: past the blank moment before the piece starts. */
  start?: number
  className?: string
  children: React.ReactNode
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const label = React.useRef<HTMLSpanElement>(null)
  const sets = React.useMemo(() => ({ desktop: tracks }), [tracks])
  // the stage follows the box's scroll events, so it catches up on the first frame
  React.useLayoutEffect(() => {
    if (box.current && start) box.current.scrollTop = start * box.current.clientHeight
  }, [start])

  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-background [container-type:size] [contain:layout]", className)}>
      <div
        ref={box}
        className="absolute inset-0 overflow-y-auto"
        onScroll={(e) => {
          const el = e.currentTarget
          if (label.current) label.current.textContent = `${(el.scrollTop / el.clientHeight).toFixed(1)} / ${length} vh`
        }}
      >
        {/* the runway: one frame per viewport height of the slice, plus the last view */}
        <div style={{ height: `${(length + 1) * 100}%` }} />
      </div>
      {/* the stage's own box: as wide as the frame, or wider and centred; positions and sizes all follow its width */}
      <div className="pointer-events-none absolute inset-y-0 [container-type:size] [contain:layout]" style={{ width: `${scale * 100}%`, left: `${50 - scale * 50}%` }}>
        <ScrollStage scroller={box} tracks={sets} layout="desktop" length={length}>
          {children}
        </ScrollStage>
      </div>
      <span
        ref={label}
        data-demo-overlay
        className="pointer-events-none absolute right-3 bottom-2 rounded bg-background/80 px-1.5 font-mono text-xs text-muted-foreground"
      >
        {`${start.toFixed(1)} / ${length} vh`}
      </span>
    </div>
  )
}
