import { DotGrid } from "@/registry/mewo/ui/dot-grid"
import type { PropDoc } from "./types"

export default function DotGridDemo() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl bg-[#0b0c12]">
      <DotGrid className="absolute inset-0" />
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight">Dot Grid</h2>
        <p className="mt-2 text-white/70">Move the pointer to push the dots. Click for a shockwave.</p>
      </div>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "dotSize", type: "number", default: "5", description: "Dot diameter, in CSS pixels." },
  { name: "gap", type: "number", default: "18", description: "Space between dots, in CSS pixels." },
  { name: "baseColor", type: "string", default: '"#3a3446"', description: "Colour of a resting dot." },
  {
    name: "activeColor",
    type: "string",
    default: '"#ffffff"',
    description: "Colour a dot moves towards as it gets excited.",
  },
  { name: "shape", type: '"circle" | "square"', default: '"circle"', description: "Dot shape." },
  {
    name: "proximity",
    type: "number",
    default: "140",
    description: "How close the pointer has to be to push a dot, in pixels.",
  },
  { name: "strength", type: "number", default: "1", description: "How hard the pointer pushes." },
  {
    name: "bounce",
    type: "number",
    default: "0.6",
    description: "How springy the return is: 0 settles, 1 overshoots.",
  },
  { name: "tension", type: "number", default: "0.4", description: "How much neighbouring dots pull on each other." },
  { name: "returnDuration", type: "number", default: "0.8", description: "Seconds a dot takes to settle." },
  {
    name: "shockRadius",
    type: "number",
    default: "320",
    description: "Reach of the ring a click sends out, in pixels.",
  },
  { name: "shockStrength", type: "number", default: "5", description: "Height of that ring." },
  { name: "swell", type: "number", default: "0.8", description: "How much a moving dot grows." },
  { name: "stretch", type: "number", default: "0.5", description: "How much a moving dot smears along its motion." },
  { name: "glow", type: "number", default: "0.5", description: "Halo around an excited dot." },
  { name: "fade", type: "number", default: "0", description: "Fade towards the edges, 0 to 1." },
  { name: "opacity", type: "number", default: "1", description: "Overall opacity." },
  { name: "intro", type: "boolean", default: "true", description: "Pop the dots in from the centre on mount." },
  { name: "mouseInteraction", type: "boolean", default: "true", description: "Let the pointer push the dots." },
  { name: "clickShock", type: "boolean", default: "true", description: "Send a ring out on click." },
  { name: "paused", type: "boolean", default: "false", description: "Freeze the simulation." },
  { name: "dpr", type: "number", description: "Override the device pixel ratio, which is capped at 2 by default." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
