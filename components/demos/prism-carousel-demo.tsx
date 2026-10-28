import { PrismCarousel } from "@/registry/mewo/ui/prism-carousel"
import type { PropDoc } from "./types"

export default function PrismCarouselDemo() {
  return (
    <div className="h-140 w-full overflow-hidden rounded-xl">
      <PrismCarousel />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "items", type: "{ src: string; alt: string; title?: string; subtitle?: string; href?: string }[]", default: "placeholder photos", description: "Images to show, in order. They are drawn with WebGL, so they must allow cross-origin loading." },
  { name: "startIndex", type: "number", default: "0", description: "Index of the image shown first." },
  { name: "aspect", type: "number", default: "1.5", description: "Width divided by height of the active image. Neighbours are narrower crops of their images." },
  { name: "size", type: "number", default: "0.62", description: "Height of the active image as a fraction of the space above the caption." },
  { name: "neighborScale", type: "number", default: "0.66", description: "Height of the neighbouring images relative to the active one." },
  { name: "gap", type: "number", default: "14", description: "Space between images in pixels." },
  { name: "radius", type: "number", default: "18", description: "Corner radius of the active image in pixels. Neighbours scale it with their height." },
  { name: "saturation", type: "number", default: "0", description: "Colour of the images that are not active, from 0 (monochrome) to 1 (full colour)." },
  { name: "dim", type: "number", default: "0.2", description: "How much the images away from the centre darken." },
  { name: "sweep", type: "number", default: "1", description: "Strength of the band of spectrum that sweeps across each new image. 0 turns the colour on without a sweep." },
  { name: "sweepDuration", type: "number", default: "1.1", description: "Seconds the sweep takes to cross an image." },
  { name: "dispersion", type: "number", default: "1", description: "How strongly images split into a spectrum while the carousel moves. 0 keeps them sharp." },
  { name: "autoplay", type: "boolean", default: "true", description: "Advance to the next image every interval seconds. Holds off screen and for reduced-motion users." },
  { name: "interval", type: "number", default: "4.5", description: "Seconds between autoplay steps." },
  { name: "loop", type: "boolean", default: "true", description: "Wrap around at the ends." },
  { name: "captions", type: "boolean", default: "true", description: "Show the title and subtitle of the active image." },
  { name: "controls", type: "boolean", default: "true", description: "Show previous and next buttons with a counter." },
  { name: "draggable", type: "boolean", default: "true", description: "Drag or swipe sideways to move between images, with inertia and snapping." },
  { name: "wheel", type: "boolean", default: "true", description: "Scroll to move between images, one image per notch." },
  { name: "pauseOnHover", type: "boolean", default: "true", description: "Pause autoplay while the pointer is over the carousel. Hovering a neighbour also lets some colour in." },
  { name: "backgroundColor", type: "string", default: '"transparent"', description: "Background of the component, any CSS colour. Caption and controls turn near-black or near-white to suit it." },
  { name: "paused", type: "boolean", default: "false", description: "Stops autoplay. Reduced-motion users also get no sweep or dispersion." },
  { name: "dpr", type: "number", default: "2", description: "Most device pixels per CSS pixel the canvas uses. It is never more than 2." },
  { name: "controlsRef", type: "React.Ref<{ next(): void; previous(): void; goTo(index: number): void }>", description: "Receives next(), previous() and goTo(index) to move the carousel from outside." },
  { name: "onIndexChange", type: "(index: number) => void", description: "Called when a different image becomes active." },
  { name: "onSelect", type: "(item: PrismCarouselItem, index: number) => void", description: "Called when the active image is clicked or Enter is pressed. An item's href is opened after it." },
  { name: "aria-label", type: "string", default: '"Prism carousel. Scroll, drag or use the arrow keys to move between images."', description: "Accessible name of the carousel region." },
  { name: "children", type: "React.ReactNode", description: "Rendered on top of the carousel, after the caption." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent and is at least 420px tall." },
]
