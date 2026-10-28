import { SkewedCarousel } from "@/registry/mewo/ui/skewed-carousel"
import type { PropDoc } from "./types"

export default function SkewedCarouselDemo() {
  return <SkewedCarousel aria-label="Sample photographs" className="py-6" />
}

export const props: PropDoc[] = [
  { name: "items", type: "{ image: string; title: string; alt?: string }[]", default: "placeholder photos", description: "Slides, in order. The title captions the active slide and names it for screen readers." },
  { name: "initialIndex", type: "number", default: "3", description: "Slide focused on mount." },
  { name: "cardWidth", type: "number", default: "200", description: "Slide width in pixels." },
  { name: "aspectRatio", type: "string", default: '"3 / 4"', description: "Aspect ratio of each slide, as CSS aspect-ratio." },
  { name: "rotation", type: "number", default: "60", description: "Degrees each slide turns per step away from the active one." },
  { name: "inactiveScale", type: "number", default: "0.85", description: "Scale of every inactive slide." },
  { name: "perspective", type: "number", default: "800", description: "Perspective of each slide, in pixels." },
  { name: "borderRadius", type: "number", default: "8", description: "Corner radius of the slides, in pixels." },
  { name: "titleBlur", type: "number", default: "2", description: "Blur on inactive captions, in pixels." },
  { name: "speed", type: "number", default: "1", description: "Multiplier on the transition duration. 2 is twice as slow." },
  { name: "showTitles", type: "boolean", default: "true", description: "Show the caption on the active slide." },
  { name: "showControls", type: "boolean", default: "true", description: "Show the previous and next buttons." },
  { name: "showDots", type: "boolean", default: "true", description: "Show the progress dots." },
  { name: "loop", type: "boolean", default: "false", description: "Wrap around at either end." },
  { name: "autoplay", type: "boolean", default: "false", description: "Advance on a timer. It holds while the pointer or keyboard focus is on the carousel, and off screen." },
  { name: "autoplayDelay", type: "number", default: "3000", description: "Delay between automatic advances, in milliseconds." },
  { name: "enableDrag", type: "boolean", default: "true", description: "A sideways drag of 45px or more moves one slide." },
  { name: "enableKeyboard", type: "boolean", default: "true", description: "Left and right arrow keys move one slide while the carousel has focus." },
  { name: "onIndexChange", type: "(index: number) => void", description: "Called with the active slide's index whenever it changes." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
