import { CornerWordmarkToggle } from "./corner-wordmark-toggle"
import type { PropDoc } from "./types"

export default function CornerWordmarkDemo() {
  return (
    // a transformed box contains the fixed position; light under the name's first letters and dark after them shows
    // the difference blend
    <div className="[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] relative h-[40vh] overflow-hidden rounded-xl border bg-[linear-gradient(90deg,#e6e0dc_calc(var(--story-u)*5),#1d1d1f_calc(var(--story-u)*5))] [container-type:size] [contain:layout]">
      <CornerWordmarkToggle />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "show", type: "boolean", default: "true", description: "Whether it shows; it fades in and out." },
  { name: "onHome", type: "() => void", description: "Called on click in place of following href (e.g. to scroll a story back to its start)." },
  { name: "href", type: "string", default: '"#top"', description: "Where the link points without onHome." },
  { name: "homeLabel", type: "string", default: '"back to the start"', description: "Read after the name by screen readers, in the page's language." },
  { name: "children", type: "ReactNode", default: '"Atlas"', description: "The name. Hidden on phones, where an Intro Wordmark stays at the top." },
  { name: "className", type: "string", description: "Merged onto the link." },
]
