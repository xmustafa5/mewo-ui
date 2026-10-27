import type { CustomizeModule } from "./types"

/**
 * Item name → lazy customize module. An item with an entry shows its Customize panel under the preview in place
 * of the static demo; one without keeps the demo. The demo stays either way: the catalog card and the preview
 * page are filmed and framed from it.
 */
export const customize: Record<string, () => Promise<CustomizeModule>> = {
  "text-shimmer": () => import("./text-shimmer"),
  "spotlight-card": () => import("./spotlight-card"),
  "zoom-picture": () => import("./zoom-picture"),
}
