import { PortraitPair } from "@/registry/mewo/blocks/portrait-pair"
import { ScrollBox } from "./scroll-box"
import type { PropDoc } from "./types"

export default function PortraitPairDemo() {
  // the stage pins to its nearest scroll container, so the section scrolls inside this box. It opens on the first
  // line, already faded in
  return (
    <ScrollBox start={0.2} className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
      <PortraitPair />
    </ScrollBox>
  )
}

export const props: PropDoc[] = [
  { name: "line", type: "string", default: "a placeholder line", description: "The large line shown first, alone in the middle." },
  { name: "text", type: "string", default: "a placeholder paragraph", description: "The paragraph shown under the two portraits at the end; *italic* and [linked words] markup." },
  { name: "href", type: "string", default: '"#"', description: "Where the paragraph's linked words point." },
  { name: "first", type: "{ src; ratio; alt?; credit? }", default: "a placeholder portrait", description: "The first portrait: it rises to the middle, then moves to the inline start." },
  { name: "second", type: "{ src; ratio; alt?; credit? }", default: "a placeholder portrait", description: "The second portrait: it rises at half size inside the first, then grows beside it." },
  { name: "sketches", type: "{ src; ratio; alt? }[]", default: "four placeholders", description: "Up to four small pictures that fan out around the portraits and gather back into them. Wide screens only." },
  { name: "length", type: "number", default: "7.8", description: "Viewport heights of scroll the section plays over once its stage is pinned." },
  { name: "className", type: "string", description: "Merged onto the section." },
]
