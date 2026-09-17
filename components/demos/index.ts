import type { ComponentType } from "react"
import type { PropDoc } from "./types"

export type DemoModule = { default: ComponentType; props: PropDoc[] }

/** Item name → lazy demo module. Every catalog item must have an entry here. */
export const demos: Record<string, () => Promise<DemoModule>> = {
  "text-shimmer": () => import("./text-shimmer-demo"),
  marquee: () => import("./marquee-demo"),
  "split-text": () => import("./split-text-demo"),
  "spotlight-card": () => import("./spotlight-card-demo"),
  "scroll-reveal": () => import("./scroll-reveal-demo"),
  "aurora-background": () => import("./aurora-background-demo"),
  "hero-aurora": () => import("./hero-aurora-demo"),
  "features-spotlight": () => import("./features-spotlight-demo"),
  tabs: () => import("./tabs-demo"),
}
