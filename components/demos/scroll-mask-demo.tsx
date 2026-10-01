import { ScrollMask, type ScrollMaskVariant } from "@/registry/mewo/ui/scroll-mask"
import type { PropDoc } from "./types"

const VARIANTS: ScrollMaskVariant[] = ["iris", "wipe", "curtain", "slats", "grid", "type"]

export default function ScrollMaskDemo() {
  return (
    // Each frame pins to its nearest scroll container, so the demo scrolls inside this box.
    <div className="h-[480px] w-full overflow-y-auto rounded-lg border">
      {VARIANTS.map((variant) => (
        <ScrollMask key={variant} variant={variant} scrollLength={1} overlay={0.3} alt="Landscape photograph">
          <div className="px-6 text-center text-white">
            <p className="text-[10px] tracking-[0.32em] uppercase opacity-70">Variant</p>
            <h3 className="mt-2 text-4xl font-medium tracking-tight capitalize">{variant}</h3>
          </div>
        </ScrollMask>
      ))}
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "variant", type: '"iris" | "wipe" | "curtain" | "slats" | "grid" | "type"', default: '"iris"', description: "Which mask geometry drives the reveal." },
  { name: "src", type: "string", default: "a placeholder photo", description: "Image revealed through the mask." },
  { name: "alt", type: "string", default: '""', description: "Alternative text for the image." },
  { name: "word", type: "string", default: '"SCROLL"', description: "Word carved out of the frame in the type variant." },
  { name: "scrollLength", type: "number", default: "1.7", description: "Scroll runway beyond the pinned viewport, in viewport heights." },
  { name: "settle", type: "number", default: "0.84", description: "Fraction of the runway after which the reveal has fully opened." },
  { name: "smooth", type: "number", default: "0.14", description: "Seconds the reveal trails the scroll position. 0 snaps instantly." },
  { name: "feather", type: "number", default: "14", description: "Edge softness of the mask, as a percentage of the frame." },
  { name: "stagger", type: "number", default: "0.55", description: "Delay spread across pieces. 0 fires them together." },
  { name: "columns", type: "number", default: "9", description: "Strip count for slats, column count for grid." },
  { name: "originX", type: "number", default: "50", description: "Horizontal anchor of the reveal, as a percentage." },
  { name: "originY", type: "number", default: "50", description: "Vertical anchor of the reveal, as a percentage." },
  { name: "angle", type: "number", default: "108", description: "Sweep direction of the wipe variant, in degrees." },
  { name: "zoom", type: "number", default: "1.14", description: "Scale the image starts at before settling back to 1." },
  { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "How the image fills the frame." },
  { name: "radius", type: "number", default: "18", description: "Corner radius of the frame, in pixels." },
  { name: "overlay", type: "number", default: "0", description: "Opacity of the scrim laid over the image." },
  { name: "background", type: "string", default: '"transparent"', description: "Colour behind the frame." },
  { name: "revealContent", type: "boolean", default: "true", description: "Fade children in as the reveal completes." },
  { name: "calm", type: "boolean", default: "false", description: "Hold the reveal steady on the scroll position instead of damping toward it." },
  { name: "children", type: "ReactNode", description: "Content layered over the frame." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
