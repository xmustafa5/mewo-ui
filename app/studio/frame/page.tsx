import type { Metadata } from "next"
import { FrameLoader } from "@/components/studio/frame/frame-loader"

export const metadata: Metadata = { title: "Background preview", robots: { index: false, follow: false } }

/**
 * The document the studio's preview iframe loads. It is deliberately bare: one background, its own clock,
 * and a bridge on `window` for the studio to drive it.
 */
export default function StudioFramePage() {
  return <FrameLoader />
}
