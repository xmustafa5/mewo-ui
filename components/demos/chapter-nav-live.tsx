"use client"

import * as React from "react"
import { ChapterNav } from "@/registry/mewo/ui/chapter-nav"

/** The nav with a reader's position it can move: picking a chapter jumps there. Its state lives here so the demo
 * module stays server-safe. */
export function ChapterNavLive() {
  const [progress, setProgress] = React.useState(24)
  return <ChapterNav progress={progress} onChapter={setProgress} />
}
