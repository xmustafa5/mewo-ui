import { ScrollCaptions } from "@/registry/mewo/ui/scroll-captions"
import type { PropDoc } from "./types"

const CAPTIONS = [
  <>Around 3000 BCE, a sculptor carved a tall <em>vessel</em> from stone.</>,
  "It stood in a temple, carried out for the city's festivals.",
  "Centuries later, it was buried with the temple that kept it.",
  "In the 1930s, an expedition found it, broken, with an ancient repair.",
  "Today it stands in a museum, its long journey written beside it.",
]

export default function ScrollCaptionsDemo() {
  // the stage pins to its nearest scroll container, so the demo scrolls inside this box
  return (
    <div className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background">
      <ScrollCaptions captions={CAPTIONS} />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "captions", type: "ReactNode[]", default: "four placeholder lines", description: "The captions, shown one at a time in the same place as the reader scrolls." },
  { name: "step", type: "number", default: "0.85", description: "Viewport heights of scroll each caption holds. The section is that much taller per caption, plus one viewport." },
  { name: "captionClassName", type: "string", description: "Merged onto every caption: its place (centred in the stage), width and type." },
  { name: "onCaptionChange", type: "(index: number) => void", description: "Called with the index of the caption that comes up, e.g. to move a timeline beside it." },
  { name: "className", type: "string", description: "Merged onto the section." },
]
