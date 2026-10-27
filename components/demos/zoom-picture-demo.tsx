import { ZoomPicture } from "@/registry/mewo/ui/zoom-picture"
import type { PropDoc } from "./types"

export default function ZoomPictureDemo() {
  // the box scrolls by itself: the picture pins in it, zooms in, pans down through itself and zooms back out
  return (
    <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background">
      <ZoomPicture>
        <p className="max-w-[24ch] font-heading text-2xl leading-tight sm:text-4xl">Who made it, and why it was buried, are not recorded.</p>
      </ZoomPicture>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "src", type: "string", default: "a placeholder photo", description: "The picture, about 5 : 6 (cropped to fill)." },
  { name: "alt", type: "string", default: '""', description: "Its description." },
  { name: "scroll", type: "boolean", default: "true", description: "Drives itself from the scroll of its nearest scroll container or the page: it pins, zooms in until it fills the view, pans down through the picture, then zooms back out and leaves (about 8.5 view heights). False when a scroll stage moves it instead: it then only darkens with the stage's --s, and className gives its size." },
  { name: "children", type: "ReactNode", description: "Shown over the picture once it fills the view, in white on the scrim." },
  { name: "className", type: "string", description: "Merged onto the root (with scroll, the tall box the picture pins in)." },
]
