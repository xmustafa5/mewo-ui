import { ParallaxCarousel } from "@/registry/mewo/ui/parallax-carousel"
import type { PropDoc } from "./types"

export default function ParallaxCarouselDemo() {
  return <ParallaxCarousel className="h-[600px]" />
}

export const props: PropDoc[] = [
  {
    name: "images",
    type: "string[]",
    default: "placeholder photos",
    description:
      "Image URLs, in order. Landscape images give the parallax room to slide inside the portrait planes. The tone curve needs them same-origin, data: or served with CORS headers; other images show as they are.",
  },
  { name: "imageWidth", type: "number", default: "420", description: "Plane width in pixels." },
  { name: "imageHeight", type: "number", default: "560", description: "Plane height in pixels." },
  { name: "gap", type: "number", default: "32", description: "Gap between planes in pixels." },
  { name: "parallaxIntensity", type: "number", default: "0.4", description: "How far each image slides inside its plane as the plane moves away from the centre, 0 to 1." },
  { name: "uvScale", type: "number", default: "1", description: "The image is zoomed by 1 / uvScale inside its plane, for more parallax room. 0.6 to 1." },
  { name: "lerp", type: "number", default: "0.08", description: "Share of the remaining distance the strip covers per 60 fps frame, 0 to 1, at any frame rate. Lower glides longer." },
  { name: "wheelSensitivity", type: "number", default: "1", description: "Multiplier on wheel movement. Either wheel axis moves the strip sideways." },
  { name: "dragSensitivity", type: "number", default: "1.4", description: "Multiplier on drag movement. The strip glides to a stop on release, without a fling." },
  {
    name: "loop",
    type: "boolean",
    default: "false",
    description: "Loop endlessly; the planes wrap around. Without it the scroll runs from the first image centred to content width minus view width, so the last images stop short of the centre.",
  },
  { name: "borderRadius", type: "number", default: "16", description: "Corner radius of the planes, in pixels." },
  { name: "autoplaySpeed", type: "number", default: "0", description: "Idle drift in pixels per second; 0 turns it off. It holds while dragging, off screen and with reduced motion." },
  { name: "pauseOnHover", type: "boolean", default: "true", description: "Hold the drift while a mouse is over the carousel." },
  {
    name: "showProgress",
    type: "boolean",
    default: "true",
    description: "Show a progress line at the bottom. It fills over the scroll range (content width minus view width), and is hidden in loop mode and when there is nothing to scroll.",
  },
  {
    name: "toneGamma",
    type: "number",
    default: "2.2",
    description: "Tone curve applied to the images: each channel becomes (v / 255) ^ toneGamma. 2.2 gives a deep, saturated look; 1 keeps the true colours.",
  },
  {
    name: "controlsRef",
    type: "React.Ref<{ scrollToIndex: (index: number) => void; reset: () => void }>",
    description:
      "Receives scrollToIndex, which glides to an image, and reset, which glides back to the start. Without loop the glide stops at content width minus view width, so the last images do not reach the centre.",
  },
  {
    name: "aria-label",
    type: "string",
    default: '"Image carousel. Drag, scroll or use the arrow keys to move through the images."',
    description: "Accessible name of the carousel region.",
  },
  { name: "className", type: "string", description: "Merged onto the root element. The carousel fills its parent and is at least 320px tall; set the height here." },
]
