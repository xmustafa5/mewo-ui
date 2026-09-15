import { FeaturesSpotlight } from "@/registry/mewo/blocks/features-spotlight"
import type { PropDoc } from "./types"

export default function FeaturesSpotlightDemo() {
  return <FeaturesSpotlight />
}

export const props: PropDoc[] = [
  { name: "eyebrow", type: "string", default: '"Why mewo"', description: "Shimmering label above the heading." },
  { name: "title", type: "string", description: "Section heading." },
  { name: "features", type: "{ icon?: ReactNode; title: string; description: string }[]", description: "Cards in the grid. Three by default." },
  { name: "logos", type: "ReactNode[]", description: "Items in the marquee under the grid." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
