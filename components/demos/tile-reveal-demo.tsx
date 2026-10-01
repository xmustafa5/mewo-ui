import { TileReveal } from "@/registry/mewo/ui/tile-reveal"
import type { PropDoc } from "./types"

// Any image URLs work; these are placeholders.
const IMAGES = Array.from({ length: 12 }, (_, index) => `https://picsum.photos/seed/mewo-tile-${index + 1}/480/480`)

export default function TileRevealDemo() {
  return (
    // The stage pins to its nearest scroll container, so the demo scrolls inside this box.
    <div className="h-[480px] w-full overflow-y-auto rounded-lg border">
      <TileReveal
        images={IMAGES}
        gridWidth={560}
        gap={20}
        headline={<h2 className="max-w-[11ch] text-4xl font-semibold tracking-tight sm:text-5xl">Every piece in its place</h2>}
      >
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          The grid comes together as you scroll, then clears the way for what you want to say.
        </p>
        <a
          href="#"
          className="mt-5 inline-flex rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Get started
        </a>
      </TileReveal>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "images", type: "string[]", description: "Image URLs laid out row by row into the grid." },
  { name: "headline", type: "ReactNode", description: "Content that stays visible through the whole sequence, centred over the tiles." },
  { name: "children", type: "ReactNode", description: "Content revealed once the tiles have cleared the stage." },
  { name: "columns", type: "number", default: "3", description: "Number of grid columns." },
  { name: "gap", type: "number", default: "28", description: "Gap between tiles in pixels." },
  { name: "gridWidth", type: "number", default: "720", description: "Maximum grid width in pixels; shrinks with the stage." },
  { name: "tileAspect", type: "number", default: "1", description: "Width to height ratio of each tile." },
  { name: "tileRadius", type: "number", default: "0", description: "Corner radius of each tile in pixels." },
  { name: "grayscale", type: "boolean", default: "true", description: "Render the images in grayscale." },
  { name: "direction", type: '"alternate" | "top" | "bottom"', default: '"alternate"', description: "Which edge columns enter through." },
  { name: "stagger", type: "number", default: "0.06", description: "Delay between tiles in a column, relative to one tile's flight time." },
  { name: "overlap", type: "number", default: "0.6", description: "How far the zoom phase overlaps the fly-in, as a fraction of one flight." },
  { name: "zoom", type: "number", default: "2.05", description: "Scale the grid reaches before the tiles leave the stage." },
  { name: "spread", type: "number", default: "0.4", description: "Minimum push, as a fraction of a tile, the columns and centre rows spread apart. Tiles always travel far enough to clear the stage." },
  { name: "scrollLength", type: "number", default: "3", description: "Extra viewport heights of scroll that drive the sequence." },
  { name: "scrub", type: "number", default: "0.08", description: "Seconds the motion lags behind the scroll position. Zero locks to it." },
  { name: "contentGap", type: "number", default: "28", description: "Gap between the headline and the revealed content in pixels." },
  { name: "backgroundColor", type: "string", default: '"transparent"', description: "Stage background." },
  { name: "onProgress", type: "(progress: number) => void", description: "Called with the sequence progress, 0 to 1." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
