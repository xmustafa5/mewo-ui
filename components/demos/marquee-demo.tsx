import { Marquee } from "@/registry/mewo/ui/marquee"
import type { PropDoc } from "./types"

const LOGOS = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"]

export default function MarqueeDemo() {
  return (
    <Marquee className="w-full max-w-xl [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      {LOGOS.map((name) => (
        <span key={name} className="text-xl font-semibold text-muted-foreground/70">
          {name}
        </span>
      ))}
    </Marquee>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "The items to scroll. Rendered `repeat` times for a seamless loop." },
  { name: "direction", type: '"left" | "right"', default: '"left"', description: "Scroll direction." },
  { name: "speed", type: "number", default: "30", description: "Seconds for one full loop." },
  { name: "pauseOnHover", type: "boolean", default: "true", description: "Pause the animation while hovered." },
  { name: "repeat", type: "number", default: "4", description: "Copies of the children in the track. Raise it when one copy is much narrower than the container." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
