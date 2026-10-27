import { PictureCloudScroll } from "./picture-cloud-scroll"
import type { PropDoc } from "./types"

export default function PictureCloudDemo() {
  // the box scrolls by itself: its scroll position drives the cloud through its whole sequence
  return <PictureCloudScroll />
}

export const props: PropDoc[] = [
  { name: "images", type: "string[]", description: "Pictures for the tiles, cycled (served with CORS). Left out, the tiles are painted in warm stone tones." },
  { name: "progress", type: "number", default: "0.1", description: "Where the cloud is in its sequence, 0 to 1: petals form and drift into a pile, a second ring follows, the pile grows into a turning ball that ghosts, pulls back, slides aside and fades." },
  { name: "controlsRef", type: "Ref<{ setProgress(p) }>", description: "Drives the sequence every frame (from a scroll position, say) without re-rendering." },
  { name: "count", type: "number", default: "1766", description: "How many tiles make the ball; the rings scale with it." },
  { name: "petals", type: "number", default: "10", description: "Petals in the first ring." },
  { name: "outlines", type: "boolean", default: "true", description: "Faint outlined squares around the ball in the later part of the sequence." },
  { name: "dpr", type: "number", description: "Overrides the device pixel ratio, which is capped at 2." },
  { name: "className", type: "string", description: "Merged onto the root, which fills its parent: give the parent a size." },
]
