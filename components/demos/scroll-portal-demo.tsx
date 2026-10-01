import { ScrollPortal, type ScrollPortalScene } from "@/registry/mewo/ui/scroll-portal"
import type { PropDoc } from "./types"

const SCENES: ScrollPortalScene[] = ["Threshold", "Drift", "Ember", "Tidal", "Zenith"].map((name, index) => ({
  // Each scene sits a little further from the page background, in light and dark.
  background: `color-mix(in oklch, var(--foreground) ${index * 4}%, var(--background))`,
  content: <p className="absolute bottom-[8%] left-[6%] text-3xl font-medium tracking-tight">{name}</p>,
}))

export default function ScrollPortalDemo() {
  return (
    // The portal pins to its nearest scroll container, so the demo scrolls inside this box.
    <div className="h-[480px] w-full overflow-y-auto rounded-lg border">
      <ScrollPortal scenes={SCENES} />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "scenes", type: "ScrollPortalScene[]", default: "[]", description: "Ordered scenes; each may set background, content, radius and accent." },
  { name: "frameDepth", type: "number", default: "1", description: "Distance between frames. Larger values nest the next frame smaller." },
  { name: "perspective", type: "number", default: "1000", description: "Focal length of the camera in pixels. Smaller values exaggerate depth." },
  { name: "scrollLength", type: "number", default: "1", description: "Scroll runway per scene handoff, in viewport heights." },
  { name: "frameRadius", type: "number", default: "16", description: "Corner radius of nested frames in pixels." },
  { name: "frameBorder", type: "number", default: "1", description: "Border width of nested frames in pixels." },
  { name: "scrub", type: "number", default: "0.35", description: "Catch-up time in seconds. 0 locks the camera to the scroll position." },
  { name: "hold", type: "number", default: "0", description: "Fraction of each handoff the camera rests before travelling." },
  { name: "dim", type: "number", default: "0.55", description: "How much nested frames fade with distance, 0 to 1." },
  { name: "dimColor", type: "string", default: '"#000000"', description: "Colour nested frames fade toward with distance." },
  { name: "accent", type: "string", default: '"color-mix(in oklch, var(--color-foreground) 18%, transparent)"', description: "Fallback border colour when a scene sets no accent." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Stage width below which depth and perspective are reduced." },
  { name: "onSceneChange", type: "(index: number) => void", description: "Called when the scene nearest the camera changes." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
