import { Grainient } from "@/registry/mewo/ui/grainient"
import { ByTheme } from "./by-theme"
import type { PropDoc } from "./types"

export default function GrainientDemo() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl">
      <ByTheme
        dark={<Grainient className="absolute inset-0" />}
        light={<Grainient className="absolute inset-0" lightMode />}
      />
      <div
        data-demo-overlay
        className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-foreground"
      >
        <h2 className="text-3xl font-bold tracking-tight">Grainient</h2>
        <p className="mt-2 text-muted-foreground">Move the pointer to stir it. Click to swirl.</p>
      </div>
    </div>
  )
}

export const props: PropDoc[] = [
  {
    name: "colors",
    type: "string[]",
    default: '["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"]',
    description: "Two to eight colours, darkest first. Blended in Oklab so the ramp never muddies.",
  },
  { name: "type", type: '"linear" | "radial"', default: '"linear"', description: "Gradient shape." },
  { name: "angle", type: "number", default: "55", description: "Direction of a linear gradient, in degrees." },
  { name: "bands", type: "number", default: "1", description: "How many times the ramp repeats across the surface." },
  { name: "softness", type: "number", default: "1", description: "Edge softness between colours, 0 to 1." },
  { name: "flow", type: "number", default: "0.8", description: "How far the surface warps." },
  { name: "scale", type: "number", default: "1", description: "Size of the warp." },
  { name: "speed", type: "number", default: "1", description: "Animation speed." },
  { name: "silk", type: "number", default: "0.35", description: "A lit, cloth-like sheen along the bands." },
  { name: "grainAmount", type: "number", default: "0.08", description: "Film grain strength." },
  { name: "grainSize", type: "number", default: "1.2", description: "Film grain size, in device pixels." },
  {
    name: "grainAnimated",
    type: "boolean",
    default: "true",
    description: "Re-seed the grain a few times a second, like film.",
  },
  { name: "contrast", type: "number", default: "1", description: "Lightness contrast." },
  { name: "saturation", type: "number", default: "1", description: "Colour saturation. 0 is greyscale." },
  {
    name: "variation",
    type: "number",
    default: "0",
    description: "Picks a different arrangement of the same colours.",
  },
  { name: "interactive", type: "boolean", default: "true", description: "Let the pointer stir the gradient." },
  { name: "stir", type: "number", default: "1", description: "How strongly the pointer stirs." },
  { name: "clickSwirl", type: "boolean", default: "true", description: "Swirl around the pointer on click." },
  { name: "intro", type: "boolean", default: "true", description: "Settle in on mount." },
  { name: "lightMode", type: "boolean", default: "false", description: "Lift the ramp for a light page." },
  { name: "dpr", type: "number", description: "Override the device pixel ratio, which is capped at 2 by default." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
