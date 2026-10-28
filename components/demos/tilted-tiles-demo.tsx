import { TiltedTiles } from "@/registry/mewo/ui/tilted-tiles"
import type { PropDoc } from "./types"

export default function TiltedTilesDemo() {
  return (
    // The wall fills its parent, so the demo gives it a box.
    <div className="h-[480px] w-full overflow-hidden rounded-lg border">
      <TiltedTiles />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "images", type: "string[]", default: "placeholder photos", description: "Image URLs tiled across the plane, each column in its own fixed shuffle. An empty list shows plain placeholder tiles." },
  { name: "columns", type: "number", default: "16", description: "Number of scrolling columns." },
  { name: "tilesPerColumn", type: "number", default: "5", description: "Tiles in one column before the loop repeats." },
  { name: "tileAspect", type: "number", default: "1", description: "Width divided by height of a single tile." },
  { name: "rowGap", type: "number", default: "8", description: "Vertical space between tiles, in pixels." },
  { name: "columnGap", type: "number", default: "8", description: "Horizontal space between columns, in pixels." },
  { name: "borderRadius", type: "number", default: "0", description: "Corner radius of each tile, in pixels." },
  { name: "perspective", type: "number", default: "1600", description: "Perspective depth of the scene, in pixels." },
  { name: "rotateX", type: "number", default: "40", description: "Degrees the plane leans back." },
  { name: "rotateY", type: "number", default: "16", description: "Degrees the plane turns sideways." },
  { name: "rotateZ", type: "number", default: "-20", description: "Degrees the plane spins within its own surface." },
  { name: "offsetX", type: "number", default: "-40", description: "Horizontal shift of the plane, in pixels." },
  { name: "offsetY", type: "number", default: "0", description: "Vertical shift of the plane, in pixels." },
  { name: "offsetZ", type: "number", default: "0", description: "Depth shift of the plane, in pixels." },
  { name: "planeWidth", type: "number", default: "280", description: "Plane width as a percentage of the root." },
  { name: "planeHeight", type: "number", default: "260", description: "Plane height as a percentage of the root." },
  { name: "stagger", type: "number", default: "20", description: "Head start given to alternating columns, as a percentage of a column's width." },
  { name: "duration", type: "number", default: "25", description: "Seconds a column takes to travel one full loop." },
  { name: "alternate", type: "boolean", default: "true", description: "Send every other column in the opposite direction." },
  { name: "fadeTop", type: "number", default: "22", description: "Height of the top fade, as a percentage of the root. 0 turns it off." },
  { name: "fadeBottom", type: "number", default: "0", description: "Height of the bottom fade, as a percentage of the root. 0 turns it off." },
  { name: "parallax", type: "boolean", default: "true", description: "Let the pointer steer the plane." },
  { name: "parallaxStrength", type: "number", default: "8", description: "Most degrees the pointer can add to the tilt." },
  { name: "pauseOnHover", type: "boolean", default: "false", description: "Hold the scroll while the pointer rests on the plane." },
  { name: "saturation", type: "number", default: "1", description: "Saturation of the tiles, where 1 is untouched." },
  { name: "aria-label", type: "string", description: "Describes the wall for screen readers, as an image. Without it the wall is decoration and hidden from them." },
  { name: "className", type: "string", description: "Merged onto the root element. The wall fills its parent; set a size here or on the parent." },
]
