import { PictureTrail } from "@/registry/mewo/ui/picture-trail"
import type { PropDoc } from "./types"

export default function PictureTrailDemo() {
  // the stage pins to its nearest scroll container, so the demo scrolls inside this box
  return (
    <div className="h-[min(70vh,560px)] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
      <PictureTrail />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "top", type: "string", default: '"Conqueror"', description: "The huge name that crosses the view first, from the bottom to the top." },
  { name: "bottom", type: "string", default: '"Last ruler"', description: "The huge name that follows and stays, faded, behind the picture." },
  { name: "holders", type: "string[]", default: "six dynasties", description: "The holders, passing in turn beside the picture, left and right (six have room)." },
  { name: "image", type: "{ src, alt?, credit: { title, by, line, href? } }", default: "a picsum photo", description: "The picture (about 9 : 10), with its credit under it." },
  { name: "className", type: "string", description: "Merged onto the root: the tall section the stage pins in (six view heights)." },
]
