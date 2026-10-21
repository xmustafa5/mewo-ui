import { PatternWaves } from "@/registry/mewo/ui/pattern-waves"
import type { PropDoc } from "./types"

export default function PatternWavesDemo() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl">
      <PatternWaves className="absolute inset-0" backgroundColor="#0b0c12" />
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight">Pattern Waves</h2>
        <p className="mt-2 text-white/70">Move the pointer. Click for a ripple.</p>
      </div>
    </div>
  )
}

export const props: PropDoc[] = [
  {
    name: "preset",
    type: '"silk" | "ocean" | "pond" | "lines" | "terminal" | "mesh"',
    default: '"silk"',
    description: "A starting look. Any other prop overrides what the preset sets for it.",
  },
  {
    name: "pattern",
    type: '"dot" | "square" | "plus" | "line" | "glyph"',
    default: "from preset",
    description: "The mark drawn at each cell.",
  },
  {
    name: "wave",
    type: '"silk" | "swell" | "ripple"',
    default: "from preset",
    description: "The surface the marks ride on.",
  },
  { name: "color", type: "string", default: '"#ffffff"', description: "Colour of the marks." },
  {
    name: "backgroundColor",
    type: "string",
    default: '"#000000"',
    description: 'Fill behind the marks. "transparent" shows what is underneath.',
  },
  { name: "spacing", type: "number", default: "from preset", description: "Distance between cells, in CSS pixels." },
  {
    name: "markSize",
    type: "number",
    default: "from preset",
    description: "Mark size as a fraction of the spacing, 0 to 1.",
  },
  {
    name: "depth",
    type: "number",
    default: "from preset",
    description: "How much the surface's slope shades each mark.",
  },
  {
    name: "light",
    type: "number",
    default: "from preset",
    description: "Light angle relative to the wave direction, in degrees.",
  },
  { name: "shine", type: "number", default: "from preset", description: "Specular highlight strength." },
  { name: "contrast", type: "number", default: "from preset", description: "Tone contrast across the surface." },
  { name: "speed", type: "number", default: "from preset", description: "Animation speed. 0 renders once and stops." },
  { name: "scale", type: "number", default: "from preset", description: "Wavelength multiplier." },
  { name: "direction", type: "number", default: "from preset", description: "Wave direction, in degrees." },
  {
    name: "fade",
    type: '"edges" | "center" | "bottom" | "top" | "none"',
    default: '"edges"',
    description: "Where the field fades out.",
  },
  { name: "fadeSize", type: "number", default: "0.5", description: "How far the fade reaches." },
  { name: "opacity", type: "number", default: "1", description: "Overall opacity of the marks." },
  {
    name: "characters",
    type: "string",
    default: '".:-=+*#%@"',
    description: 'Glyphs for the "glyph" pattern, dimmest first.',
  },
  { name: "interactive", type: "boolean", default: "true", description: "Let the pointer ripple the surface." },
  { name: "cursorSize", type: "number", default: "50", description: "Ripple radius, in CSS pixels." },
  { name: "cursorStrength", type: "number", default: "0.6", description: "Ripple strength, 0 to 1." },
  { name: "intro", type: "boolean", default: "true", description: "Rise in from the centre on mount." },
  {
    name: "paused",
    type: "boolean",
    default: "false",
    description: "Freeze the animation. The last frame stays on screen.",
  },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
