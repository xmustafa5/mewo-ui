import { GradientCarousel } from "@/registry/mewo/ui/gradient-carousel"
import type { PropDoc } from "./types"

// Any image URLs work. The backdrop needs them served with CORS headers to read their colours.
const IMAGES = Array.from({ length: 8 }, (_, index) => `https://picsum.photos/seed/mewo-carousel-${index + 1}/480/600`)

export default function GradientCarouselDemo() {
  return <GradientCarousel images={IMAGES} aria-label="Sample photographs" className="h-[420px] rounded-lg" />
}

export const props: PropDoc[] = [
  { name: "images", type: "string[]", default: "placeholder photos", description: "Image URLs shown as cards. The backdrop takes its colours out of whichever card is nearest the centre." },
  { name: "maxRotationDegrees", type: "number", default: "28", description: "Most a card turns, in degrees, as it moves away from the centre." },
  { name: "maxDepthPx", type: "number", default: "140", description: "How far forward, in pixels, the centre card sits ahead of the ones at the edge." },
  { name: "minScale", type: "number", default: "0.92", description: "Scale cards shrink to as they move away from the centre, 0 to 1." },
  { name: "cardGap", type: "number", default: "28", description: "Gap between cards in pixels." },
  { name: "frictionFactor", type: "number", default: "0.9", description: "Velocity kept per frame, 0.5 to 0.99. Lower values stop the glide sooner." },
  { name: "wheelSensitivity", type: "number", default: "0.6", description: "Multiplier on wheel movement. 0 leaves the wheel to the page." },
  { name: "dragSensitivity", type: "number", default: "1", description: "Multiplier on drag movement." },
  { name: "backgroundBlur", type: "number", default: "24", description: "Blur applied to the gradient backdrop, in pixels." },
  { name: "gradientSize", type: "number", default: "0.65", description: "Radius of the backdrop's colour pools, 0 to 1." },
  { name: "gradientIntensity", type: "number", default: "0.7", description: "Opacity of the backdrop's colour pools, 0 to 1." },
  { name: "enableKeyboard", type: "boolean", default: "true", description: "Move one card per press of the left and right arrow keys while the carousel has focus." },
  { name: "onCardChange", type: "(index: number) => void", description: "Called with the index of the card nearest the centre whenever it changes." },
  { name: "cardAspectRatio", type: "number", default: "0.8", description: "Width to height ratio of each card." },
  { name: "initialIndex", type: "number", default: "0", description: "Card centred when the carousel first renders." },
  { name: "className", type: "string", description: "Merged onto the root element. Set the height here; it defaults to 600px." },
]
