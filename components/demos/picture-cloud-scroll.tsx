"use client"

import * as React from "react"
import { PictureCloud, type PictureCloudControls } from "@/registry/mewo/ui/picture-cloud"

/** A box that scrolls by itself: its scroll position drives the cloud through its whole sequence. The handler lives
 * here so the demo module stays server-safe. */
export function PictureCloudScroll() {
  const cloud = React.useRef<PictureCloudControls>(null)
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const box = e.currentTarget
    const end = Math.max(1, box.scrollHeight - box.clientHeight)
    cloud.current?.setProgress(0.04 + 0.96 * (box.scrollTop / end))
  }
  return (
    // the sticky stage is as tall as the box whatever height the box is given: container units
    <div onScroll={onScroll} className="h-[min(70vh,640px)] w-full overflow-y-auto rounded-xl border bg-background [container-type:size]">
      <div className="h-[600%]">
        <div className="sticky top-0 h-[100cqh]">
          <PictureCloud controlsRef={cloud} progress={0.04} />
        </div>
      </div>
    </div>
  )
}
