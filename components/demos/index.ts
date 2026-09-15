import type { ComponentType } from "react"
import type { PropDoc } from "./types"

export type DemoModule = { default: ComponentType; props: PropDoc[] }

/** Item name → lazy demo module. Every catalog item must have an entry here. */
export const demos: Record<string, () => Promise<DemoModule>> = {
  "text-shimmer": () => import("./text-shimmer-demo"),
  marquee: () => import("./marquee-demo"),
  "split-text": () => import("./split-text-demo"),
  "spotlight-card": () => import("./spotlight-card-demo"),
}
