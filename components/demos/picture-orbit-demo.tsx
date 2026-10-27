import { PictureOrbit } from "@/registry/mewo/ui/picture-orbit"
import type { PropDoc } from "./types"

export default function PictureOrbitDemo() {
  // the box scrolls by itself: the stage pins in it and the cards rise around the title
  return (
    <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background">
      <PictureOrbit />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "images", type: "{ src: string; aspect: number }[]", default: "72 picsum photos", description: "The pictures on the cards, with their proportions (width ÷ height), served with CORS; each depth layer cycles through them in its own order (up to 100)." },
  { name: "children", type: "ReactNode", default: "a two-line title", description: "Held still in the middle while the cards travel around it." },
  { name: "length", type: "number", default: "4.6", description: "View heights of scroll it stays pinned for, the cards rising all the while at their own pace." },
  { name: "lean", type: "number", default: "1", description: "How far the cards lean away from the pointer, the nearer ones more: 0 holds them still." },
  { name: "float", type: "boolean", default: "true", description: "The cards' slow idle drift. Off, nothing moves while the reader neither scrolls nor moves the pointer." },
  { name: "onPick", type: "(index: number) => void", description: "Called with a picture's index in images when its card is clicked." },
  { name: "dpr", type: "number", description: "Overrides the device pixel ratio, which is capped at 2." },
  { name: "className", type: "string", description: "Merged onto the root: the tall box the stage pins in." },
]
