import { ConcaveCarousel } from "@/registry/mewo/ui/concave-carousel"
import type { PropDoc } from "./types"

export default function ConcaveCarouselDemo() {
  return <ConcaveCarousel className="h-[560px]" />
}

export const props: PropDoc[] = [
  { name: "items", type: "{ src: string; alt: string; title?: string; subtitle?: string; href?: string }[]", default: "placeholder photos", description: "Images hung around the wall, in order. Each is cropped to fill its panel; title and subtitle caption it, href is opened when the centred image is clicked." },
  { name: "startIndex", type: "number", default: "0", description: "Index of the image that starts in the centre." },
  { name: "aspect", type: "number", default: "1.25", description: "Width / height of every panel. Images are cropped to fill it." },
  { name: "size", type: "number", default: "0.46", description: "Height of the centred panel as a fraction of the space above the caption." },
  { name: "curvature", type: "number", default: "0.72", description: "How strongly the wall bends around the viewer: 0 is a flat strip, 1 a tight drum." },
  { name: "distance", type: "number", default: "4", description: "Viewer distance from the wall, in panel heights." },
  { name: "tilt", type: "number", default: "0", description: "Viewing angle in degrees. Negative looks up at the wall, positive looks down at the floor." },
  { name: "gap", type: "number", default: "16", description: "Space between panels in pixels, at the centred panel." },
  { name: "radius", type: "number", default: "14", description: "Corner radius in pixels, at the centred panel." },
  { name: "reflection", type: "number", default: "0.06", description: "Opacity of the floor reflection. 0 removes it." },
  { name: "dim", type: "number", default: "0.35", description: "How much the wall fades toward the left and right edges, 0 to 1." },
  { name: "autoplay", type: '"drift" | "step" | "off"', default: '"drift"', description: "drift turns the wall slowly and continuously, step moves one panel every interval, off keeps it still. Reduced motion stops both." },
  { name: "speed", type: "number", default: "0.16", description: "Drift speed in panels per second. Negative turns the other way (also for step)." },
  { name: "interval", type: "number", default: "4", description: 'Seconds between steps when autoplay is "step".' },
  { name: "snap", type: "boolean", default: "true", description: "Settle with a panel centred after a drag, flick or scroll." },
  { name: "inertia", type: "number", default: "0.5", description: "How far a flick carries the wall, 0 to 1." },
  { name: "pauseOnHover", type: "boolean", default: "true", description: "Brake the motion while the pointer rests on the wall." },
  { name: "draggable", type: "boolean", default: "true", description: "Drag or flick the wall to turn it." },
  { name: "wheel", type: "boolean", default: "true", description: "Scroll to turn the wall, one panel per notch." },
  { name: "captions", type: "boolean", default: "true", description: "Show each panel's title and subtitle under it." },
  { name: "controls", type: "boolean", default: "true", description: "Previous and next buttons with a counter." },
  { name: "backgroundColor", type: "string", default: "transparent", description: "Any CSS background for the root." },
  { name: "paused", type: "boolean", default: "false", description: "Stops autoplay. Space toggles it too." },
  { name: "onIndexChange", type: "(index: number) => void", description: "Called with the centred image's index whenever it changes." },
  { name: "onSelect", type: "(item: ConcaveCarouselItem, index: number) => void", description: "The centred image was clicked, or Enter was pressed." },
  { name: "controlsRef", type: "Ref<{ next(): void; previous(): void; goTo(index: number): void }>", description: "Receives next, previous and goTo. The root's own ref stays yours." },
  { name: "aria-label", type: "string", default: '"Curved gallery. …"', description: "Names the carousel region for screen readers." },
  { name: "className", type: "string", description: "Merged onto the root element. Give it a height here; it fills its parent and is at least 420px tall." },
]
