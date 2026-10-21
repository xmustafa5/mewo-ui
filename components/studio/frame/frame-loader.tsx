"use client"

import dynamic from "next/dynamic"

// Client only: the frame patches its window's clock at module load, which has no server-side meaning.
const StudioFrame = dynamic(() => import("./studio-frame"), { ssr: false })

export function FrameLoader() {
  return <StudioFrame />
}
