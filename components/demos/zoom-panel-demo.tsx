import { ZoomPanelScroll } from "./zoom-panel-scroll"
import type { PropDoc } from "./types"

export default function ZoomPanelDemo() {
  // scrolling inside the box sets the panel's state, as a story's scroll does: thumbnail, open, thumbnail, gone
  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-xl border bg-muted/40 [container-type:size] [contain:layout]">
      <ZoomPanelScroll />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "state", type: "\"hidden\" | \"shown\" | \"open\"", default: '"shown"', description: "Hidden, a thumbnail in the corner, or a large panel zoomed into one band of the picture. The page sets it (from its scroll, a button…); here the box's scroll does." },
  { name: "src", type: "string", default: "a picsum photo", description: "The picture (about 3 : 2)." },
  { name: "alt", type: "string", default: '""', description: "Its description." },
  { name: "caption", type: "string", default: "a placeholder", description: "Shown in the open panel." },
  { name: "className", type: "string", description: "Merged onto the panel." },
]
