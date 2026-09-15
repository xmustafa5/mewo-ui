import { ScrollReveal } from "@/registry/mewo/ui/scroll-reveal"
import type { PropDoc } from "./types"

export default function ScrollRevealDemo() {
  return (
    <div className="grid w-full max-w-md gap-4">
      {(["up", "left", "right"] as const).map((direction, index) => (
        <ScrollReveal key={direction} direction={direction} delay={index * 0.15} className="rounded-lg border p-4">
          <p className="text-sm font-medium">Reveals from {direction === "up" ? "below" : `the ${direction === "left" ? "right" : "left"}`}</p>
        </ScrollReveal>
      ))}
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "Content to reveal." },
  { name: "direction", type: '"up" | "down" | "left" | "right" | "none"', default: '"up"', description: "Direction the content travels as it appears." },
  { name: "distance", type: "number", default: "24", description: "Pixels travelled during the reveal." },
  { name: "delay", type: "number", default: "0", description: "Seconds before the reveal starts." },
  { name: "duration", type: "number", default: "0.6", description: "Seconds the reveal takes." },
  { name: "once", type: "boolean", default: "true", description: "Reveal once, or every time it enters the viewport." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
