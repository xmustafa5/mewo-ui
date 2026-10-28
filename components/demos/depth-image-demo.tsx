import { DepthImage } from "@/registry/mewo/ui/depth-image"
import type { PropDoc } from "./types"

export default function DepthImageDemo() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl">
      <DepthImage alt="A photograph relit by a moving light" />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "image", type: "string", default: "a placeholder photo", description: "Photo to relight. Must be same-origin, a data URL, or served with CORS." },
  { name: "depthMap", type: "string", description: "Optional real depth map, white near and black far. Estimated from the photo when omitted." },
  { name: "alt", type: "string", description: "Accessible description of the photo. Without it the image is decorative." },
  { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "How the photo fills the box: cropped to cover it, or shown whole inside it." },
  { name: "view", type: '"lit" | "depth" | "normal"', default: '"lit"', description: "The lit photo, or debug views of the estimated depth or the normals." },
  { name: "depthFromLight", type: "number", default: "0.5", description: "Estimated depth: 0 reads depth from vertical position only, 1 from brightness only." },
  { name: "depthSmoothing", type: "number", default: "7", description: "Blur of the height field, in steps of five texels of a 512-wide map. Applies to supplied depth maps too." },
  { name: "depthContrast", type: "number", default: "1.2", description: "Contrast applied to the estimated depth." },
  { name: "invertDepth", type: "boolean", default: "false", description: "Swap near and far." },
  { name: "displacement", type: "number", default: "1.5", description: "Height of the relief in scene units; the plane is 2 tall." },
  { name: "normalStrength", type: "number", default: "1.5", description: "Large-scale surface tilt from depth." },
  { name: "detail", type: "number", default: "0.8", description: "Fine surface detail read from the photo." },
  { name: "shadowIntensity", type: "number", default: "0.7", description: "Darkness of self-cast shadows; 0 disables them." },
  { name: "shadowSoftness", type: "number", default: "0.1", description: "Penumbra width of the shadows." },
  { name: "lightColor", type: "string", default: '"#ffffff"', description: "Colour of the moving light. Any CSS colour." },
  { name: "lightIntensity", type: "number", default: "6", description: "Brightness of the moving light." },
  { name: "falloff", type: "number", default: "2.5", description: "How quickly the light fades with distance: 0 is even, 4 is a tight pool." },
  { name: "elevation", type: "number", default: "1.2", description: "Height of the light above the surface." },
  { name: "ambient", type: "number", default: "0.02", description: "Flat fill light applied everywhere." },
  { name: "ambientColor", type: "string", default: '"#ffffff"', description: "Colour of the fill light. Any CSS colour." },
  { name: "colorPreserve", type: "number", default: "0", description: "How much of the photo's own tone survives in unlit areas, 0 to 1." },
  { name: "follow", type: "number", default: "0.12", description: "How quickly the light follows the pointer, 0 to 1 (per 60 fps frame)." },
  { name: "autoOrbit", type: "boolean", default: "true", description: "Move the light on a slow ellipse when the pointer is away." },
  { name: "orbitRadius", type: "number", default: "0.6", description: "Size of the idle orbit, 0 to 1." },
  { name: "orbitDuration", type: "number", default: "10", description: "Seconds per idle orbit." },
  { name: "backgroundColor", type: "string", default: '"#000000"', description: "Floor colour of the unlit surface, so shadows settle on the page colour." },
  { name: "fallbackColor", type: "string", default: '"#171717"', description: "Shown while the photo loads or if it fails." },
  { name: "paused", type: "boolean", default: "false", description: "Freeze the light." },
  { name: "dpr", type: "number", default: "1.5", description: "Render scale cap. The device pixel ratio is also capped at 2 and by a pixel budget." },
  { name: "children", type: "React.ReactNode", description: "Content layered above the image." },
  { name: "onLoad", type: "() => void", description: "The photo (and depth map) loaded and can be relit." },
  { name: "onError", type: "(error: Error) => void", description: "The photo could not be used: it failed to load, or its server doesn't allow cross-origin reads (CORS)." },
  { name: "className", type: "string", description: "Merged onto the root element, which fills its parent." },
]
