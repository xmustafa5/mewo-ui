import { TextScrollHighlight } from "@/registry/mewo/ui/text-scroll-highlight"
import type { PropDoc } from "./types"

export default function TextScrollHighlightDemo() {
  return (
    // The highlight follows its nearest scroll container, so the demo scrolls inside this box.
    <div className="h-[420px] w-full overflow-y-auto rounded-lg border px-8">
      <p className="py-48 text-center text-sm text-muted-foreground">Scroll down</p>
      <TextScrollHighlight as="h2" className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance">
        Words catch the light one at a time as the paragraph climbs the screen, so the eye is led down the page at
        whatever pace the reader chooses.
      </TextScrollHighlight>
      <p className="py-24 text-center text-sm text-muted-foreground">Keep going: the next one is pinned</p>
      <TextScrollHighlight
        pin
        as="h2"
        className="mx-auto max-w-xl text-center text-3xl font-semibold tracking-tight text-balance"
      >
        Pinned, the text holds still and the scroll only moves the light through it, the way a subtitle keeps its
        place on the screen.
      </TextScrollHighlight>
      <p className="py-24 text-center text-sm text-muted-foreground">The end</p>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "string", description: "The text to light word by word." },
  { name: "pin", type: "boolean", default: "false", description: "Hold the text in the middle of the viewport while the scroll lights it, like a subtitle." },
  { name: "scrollLength", type: "number", default: "1.5", description: "Viewport heights of scroll the pinned text is held for. Only used with pin." },
  { name: "dimOpacity", type: "number", default: "0.2", description: "Opacity of the words the scroll has not reached yet, 0 to 1." },
  { name: "start", type: "number", default: "0.85", description: "How far down the viewport, 0 to 1, the top of the text is when the first word starts to light. Not used with pin." },
  { name: "end", type: "number", default: "0.45", description: "How far down the viewport, 0 to 1, the bottom of the text is when the last word has lit. Not used with pin." },
  { name: "spread", type: "number", default: "4", description: "How many words are part-lit at once. 0 switches each word on at a stroke." },
  { name: "scrub", type: "number", default: "0.1", description: "Seconds the highlight trails the scroll position. 0 locks to it." },
  { name: "as", type: '"p" | "h1" | "h2" | "h3" | "span" | "div"', default: '"p"', description: "Element to render." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
