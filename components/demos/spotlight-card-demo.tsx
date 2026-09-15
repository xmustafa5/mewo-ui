import { SpotlightCard } from "@/registry/mewo/ui/spotlight-card"
import type { PropDoc } from "./types"

export default function SpotlightCardDemo() {
  return (
    <SpotlightCard className="w-80">
      <h3 className="font-semibold">Move your pointer</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The glow follows you across the card. It fades out when you leave.
      </p>
    </SpotlightCard>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "Card content." },
  { name: "spotlightColor", type: "string", default: '"rgba(255,255,255,0.15)"', description: "Colour of the glow. Any CSS colour." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
