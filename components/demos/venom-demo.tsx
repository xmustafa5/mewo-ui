import { VenomSwitch } from "./venom-switch"
import type { PropDoc } from "./types"

export default function VenomDemo() {
  return (
    // The symbiote is black in both themes; the dark theme gets a lifted backdrop so its silhouette still reads.
    <div className="relative h-80 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
      <VenomSwitch />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "text", type: "string", description: "The word the symbiote covers. Leave it out to cover children instead." },
  { name: "children", type: "ReactNode", description: "An <svg> to cover when there is no text. Only its shape is used." },
  { name: "color", type: "string", default: '"#050507"', description: "Colour of the dark matter." },
  { name: "highlight", type: "string", default: '"#ffffff"', description: "Colour of the wet highlights." },
  {
    name: "tendrils",
    type: "number",
    default: "8",
    description: "How many tendrils reach for the pointer, up to 16. 0 keeps the symbiote on the shape.",
  },
  {
    name: "reach",
    type: "number",
    default: "200",
    description: "How far from the shape the pointer can be and still be reached, in pixels.",
  },
  { name: "thickness", type: "number", default: "14", description: "Width of a tendril at its root, in pixels." },
  { name: "writhe", type: "number", default: "1", description: "How much the tendrils writhe." },
  { name: "boil", type: "number", default: "1", description: "How much the surface crawls and its edge boils." },
  { name: "scale", type: "number", default: "0.7", description: "Share of the box the shape fills, 0 to 1." },
  { name: "fontFamily", type: "string", description: "Font for text. Defaults to the font the component inherits." },
  { name: "fontWeight", type: "number | string", default: "900", description: "Weight for text." },
  { name: "speed", type: "number", default: "1", description: "0 freezes the surface; the tendrils still reach." },
  { name: "paused", type: "boolean", default: "false", description: "Freeze everything; the last frame stays." },
  { name: "dpr", type: "number", description: "Override the device pixel ratio, which is capped at 2 by default." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
