import { FeaturesSpotlight } from "@/registry/mewo/blocks/features-spotlight"
import type { PropDoc } from "./types"

export default function FeaturesSpotlightDemo() {
  return <FeaturesSpotlight />
}

export const props: PropDoc[] = [
  { name: "eyebrow", type: "string", default: '"Why mewo"', description: "Shimmering label above the heading." },
  { name: "title", type: "string", default: '"Everything you need to ship motion"', description: "Section heading." },
  { name: "features", type: "{ icon?: ReactNode; title: string; description: string }[]", default: '"Fast by default", "Light footprint", "Motion built in"', description: "Cards in the grid." },
  { name: "logos", type: "ReactNode[]", default: '"Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"', description: "Items in the marquee under the grid." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
