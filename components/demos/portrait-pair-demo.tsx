import { PortraitPair } from "@/registry/mewo/blocks/portrait-pair"
import type { PropDoc } from "./types"

export default function PortraitPairDemo() {
  // the stage pins to its nearest scroll container, so the section scrolls inside this box
  return (
    <div className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
      <PortraitPair />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "line", type: "string", default: "a placeholder line", description: "The large line shown first, alone in the middle." },
  { name: "text / href", type: "string / string", default: "a placeholder paragraph", description: "The paragraph shown under the two portraits at the end; *italic* and [linked words] markup, the links going to href." },
  { name: "first / second", type: "{ src; ratio; alt?; credit? }", default: "two placeholder portraits", description: "The portraits: the first rises to the middle, the second rises at half size inside it; then they move apart, side by side." },
  { name: "sketches", type: "{ src; ratio; alt? }[]", default: "four placeholders", description: "Up to four small pictures that fan out around the portraits and gather back into them. Wide screens only." },
  { name: "length", type: "number", default: "7.8", description: "Viewport heights of scroll the section plays over once its stage is pinned." },
  { name: "className", type: "string", description: "Merged onto the section." },
]
