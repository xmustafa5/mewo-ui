import { AlbumRail } from "@/registry/mewo/ui/album-rail"
import type { PropDoc } from "./types"

export default function AlbumRailDemo() {
  return <AlbumRail className="py-6" />
}

export const props: PropDoc[] = [
  {
    name: "albums",
    type: "{ title: string; artist: string; cover: string; color?: string }[]",
    default: "placeholder albums",
    description: "Albums, in order. The cover shows on the sleeve and the record's label; color tints the play button, which otherwise takes the cover's colour.",
  },
  { name: "initialIndex", type: "number", default: "0", description: "Index of the sleeve shown first." },
  { name: "size", type: "number", default: "280", description: "Largest sleeve edge in pixels. Shrinks to fit narrow containers." },
  { name: "visible", type: "number", default: "3", description: "How many sleeves stay visible on each side of the front one." },
  { name: "turn", type: "number", default: "22", description: "Y rotation of the side sleeves, in degrees." },
  { name: "fan", type: "number", default: "6", description: "Extra in-plane tilt per step away from the front, in degrees: the \"hand of cards\" look." },
  { name: "loop", type: "boolean", default: "true", description: "Wrap around at the ends. Needs three albums or more." },
  {
    name: "autoplay",
    type: "number | false",
    default: "4000",
    description: "Advance every this many milliseconds while nothing is playing. It holds under the mouse, with keyboard focus, during a drag and off screen. false turns it off.",
  },
  { name: "pauseOnHover", type: "boolean", default: "true", description: "Hold autoplay while a mouse is over the rail." },
  { name: "showCaption", type: "boolean", default: "true", description: "Show the title and artist under the front sleeve." },
  { name: "showControls", type: "boolean", default: "true", description: "Show the previous, tick ruler, play and next bar under the caption." },
  { name: "accent", type: "string", default: '"#b19eef"', description: "Play button tint when the cover colour can't be read (a cross-origin image served without CORS, say)." },
  { name: "onChange", type: "(index: number, album: AlbumRailItem) => void", description: "Called with the front album's index and the album whenever it changes." },
  {
    name: "onPlayChange",
    type: "(playing: boolean, index: number, album: AlbumRailItem) => void",
    description: "Called when a record starts or stops playing, with the front album's index and the album.",
  },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent's width. Name the region with aria-label; it defaults to \"Albums\"." },
]
