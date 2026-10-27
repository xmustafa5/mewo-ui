import { RisingCaptions } from "@/registry/mewo/ui/rising-captions"
import type { PropDoc } from "./types"

export default function RisingCaptionsDemo() {
  // the stage pins to its nearest scroll container, so the demo scrolls inside this box
  return (
    <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background">
      <RisingCaptions />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "captions", type: "ReactNode[]", default: "five placeholder lines", description: "The captions, rising one after another through the view as the reader scrolls." },
  { name: "step", type: "number", default: "1", description: "View heights of scroll each caption takes to rise through." },
  { name: "captionClassName", type: "string", description: "Merged onto every caption: its width and type (text-white over a dark picture, say)." },
  { name: "onCaptionChange", type: "(index: number) => void", description: "Called with the index of the caption that comes up." },
  { name: "className", type: "string", description: "Merged onto the root: the tall section the stage pins in." },
]
