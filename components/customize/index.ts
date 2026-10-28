import type { CustomizeModule } from "./types"

/**
 * Item name → lazy customize module. An item with an entry shows its Customize panel under the preview in place
 * of the static demo; one without keeps the demo. The demo stays either way: the catalog card and the preview
 * page are filmed and framed from it.
 */
export const customize: Record<string, () => Promise<CustomizeModule>> = {
  // text
  "marquee": () => import("./marquee"),
  "split-text": () => import("./split-text"),
  "venom": () => import("./venom"),
  "text-shimmer": () => import("./text-shimmer"),
  // cards and media
  "glass-panel": () => import("./glass-panel"),
  "gradient-carousel": () => import("./gradient-carousel"),
  "album-rail": () => import("./album-rail"),
  "zoom-panel": () => import("./zoom-panel"),
  "chapter-nav": () => import("./chapter-nav"),
  "scroll-captions": () => import("./scroll-captions"),
  "rising-captions": () => import("./rising-captions"),
  "spotlight-card": () => import("./spotlight-card"),
  "concave-carousel": () => import("./concave-carousel"),
  "parallax-carousel": () => import("./parallax-carousel"),
  "depth-card": () => import("./depth-card"),
  "skewed-carousel": () => import("./skewed-carousel"),
  "prism-carousel": () => import("./prism-carousel"),
  // scroll
  "scroll-portal": () => import("./scroll-portal"),
  "tile-reveal": () => import("./tile-reveal"),
  "scroll-mask": () => import("./scroll-mask"),
  "date-timeline": () => import("./date-timeline"),
  "picture-trail": () => import("./picture-trail"),
  "zoom-picture": () => import("./zoom-picture"),
  // backgrounds
  "pattern-waves": () => import("./pattern-waves"),
  "grainient": () => import("./grainient"),
  "dot-grid": () => import("./dot-grid"),
  "picture-cloud": () => import("./picture-cloud"),
  "picture-wave": () => import("./picture-wave"),
  "picture-orbit": () => import("./picture-orbit"),
  "depth-image": () => import("./depth-image"),
  "mewo-character": () => import("./mewo-character"),
  "tilted-tiles": () => import("./tilted-tiles"),
  // sections: their preview runs in a frame the panel drives
  "names-duel": () => import("./names-duel"),
  "portrait-pair": () => import("./portrait-pair"),
}
