import { DepthCard } from "@/registry/mewo/ui/depth-card"
import type { PropDoc } from "./types"

export default function DepthCardDemo() {
  return <DepthCard />
}

export const props: PropDoc[] = [
  { name: "image", type: "string", default: "placeholder photo", description: "Background image URL. Ignored when layers is set." },
  { name: "layers", type: "{ image: string; depth: number }[]", description: "Several images stacked for a deeper parallax, later ones in front. Each travels maxTranslation × depth pixels. Replaces image." },
  { name: "title", type: "string", default: '"Quiet Ridge"', description: "Heading at the bottom of the card, and its accessible name unless ariaLabel is set. It takes the place of the HTML title attribute." },
  { name: "description", type: "string", default: '"First light over the high pass."', description: "Line under the heading." },
  { name: "width", type: "number", default: "240", description: "Card width in pixels." },
  { name: "height", type: "number", default: "320", description: "Card height in pixels." },
  { name: "maxRotation", type: "number", default: "20", description: "Tilt in degrees with the pointer at an edge." },
  { name: "maxTranslation", type: "number", default: "20", description: "Image travel in pixels with the pointer at an edge, times each layer's depth." },
  { name: "borderRadius", type: "string", default: '"10px"', description: "Corner radius, as any CSS length." },
  { name: "staggerDelay", type: "number", default: "75", description: "Delay between the title's and the description's reveal, in milliseconds." },
  { name: "revealAnimation", type: '"slide" | "fade" | "scale" | "none"', default: '"slide"', description: "How the text appears on hover or keyboard focus. None shows it all the time." },
  { name: "spotlight", type: "boolean", default: "true", description: "A soft light that follows the pointer." },
  { name: "spotlightColor", type: "string", default: '"rgba(255, 255, 255, 0.5)"', description: "Colour at the centre of the light, as rgb() or rgba(). Its outer ring is the same colour at a fifth of the alpha." },
  { name: "href", type: "string", description: "Makes the card a link." },
  { name: "target", type: '"_blank" | "_self" | "_parent" | "_top"', default: '"_self"', description: 'Where the link opens. "_blank" adds rel="noopener noreferrer".' },
  { name: "onClick", type: "(event: MouseEvent) => void", description: "Called on click. Without href it makes the card a button that Enter and Space also press." },
  { name: "ariaLabel", type: "string", description: "Accessible name of the card. Defaults to the title." },
  { name: "imageAlt", type: "string", description: "Describes the image for screen readers. Without it the images are decorative." },
  { name: "disableOnMobile", type: "boolean", default: "false", description: "Turn the tilt and the spotlight off on touch-first devices." },
  { name: "respectReducedMotion", type: "boolean", default: "true", description: "Keep the card flat and the spotlight off when the user prefers reduced motion." },
  { name: "contentClassName", type: "string", description: "Merged onto the block that holds the title and description." },
  { name: "style", type: "CSSProperties", description: "Merged over the width, height and corner radius the card sets on its root." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
