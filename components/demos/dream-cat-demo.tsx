import { DreamCat } from "@/registry/mewo/ui/dream-cat"
import type { PropDoc } from "./types"

export default function DreamCatDemo() {
  return (
    // a black night behind the dream; on a page, the character shows whatever is behind it
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl bg-black">
      <DreamCat src="/models/mewo.glb" alt="The mewo cat pointing at the pointer" />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "src", type: "string", default: '"/models/mewo.glb"', description: "Address of the character's model: a .glb, y up, facing +z. Same-origin or served with CORS." },
  { name: "alt", type: "string", description: "Accessible description of the character. Without it the character is decorative." },
  { name: "color", type: "string", default: '"#000000"', description: "Fur colour, any CSS colour. An empty string keeps the model's own blue." },
  { name: "track", type: "boolean", default: "true", description: "Follow the pointer anywhere on the page: the hand reaches for it, the eyes look at it, the body leans toward it." },
  { name: "reach", type: "number", default: "86", description: "How far the arm can turn from its rest pose, in degrees. 180 lets it point anywhere." },
  { name: "stretch", type: "number", default: "3.3", description: "How far the forearm can stretch to bring the hand under the pointer, as a multiple of its length. 1 keeps it as modelled." },
  { name: "gaze", type: "number", default: "6", description: "How far the eyes can roll, in degrees. 0 holds them still." },
  { name: "lean", type: "number", default: "10", description: "How far the body turns toward the pointer, in degrees." },
  { name: "smoothing", type: "number", default: "0.16", description: "Seconds the pose takes to catch up with the pointer (about two thirds of the way)." },
  { name: "zoom", type: "number", default: "1.5", description: "Size of the character in its box: 1 fits it whole, 2 fills the box with its head and hand." },
  { name: "x", type: "number", default: "0.84", description: "Where the character's middle sits across its box: 0 at the left edge, 0.5 in the middle, 1 at the right edge." },
  { name: "y", type: "number", default: "0.71", description: "Where the character's middle sits down its box: 0 at the top edge, 0.5 in the middle, 1 at the bottom edge." },
  { name: "sheen", type: "number", default: "1.1", description: "Strength of the velvet sheen along the edges." },
  { name: "exposure", type: "number", default: "1", description: "Overall brightness." },
  { name: "fog", type: "number", default: "0.6", description: "How thick the dream's fog is, 0 to 1. 0 for no fog." },
  { name: "fogColor", type: "string", default: '"#c6c6c6"', description: "Colour of the fog and of the light along the character's fraying outline, any CSS colour." },
  { name: "swirl", type: "number", default: "2", description: "How strongly the hand stirs the fog as it moves through it. 0 leaves it still." },
  { name: "dissolve", type: "number", default: "0.63", description: "How much the character's outline blurs and comes apart into rising dots, 0 to 1. 0 keeps a clean outline." },
  { name: "eyes", type: '"rings" | "plain"', default: '"rings"', description: "The pupils: rings that ripple outward with the dream, or plain." },
  { name: "drift", type: "number", default: "1.55", description: "Speed of the dream's slow motion: the fog drifting and the wisps rising. 0 holds it still and costs nothing at rest." },
  { name: "dpr", type: "number", default: "1.5", description: "Render scale cap. The device pixel ratio is also capped at 2 and by a pixel budget." },
  { name: "children", type: "React.ReactNode", description: "Content layered above the character." },
  { name: "onLoad", type: "() => void", description: "The model loaded and the first frame is drawn." },
  { name: "onError", type: "(error: Error) => void", description: "The model could not be loaded." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
