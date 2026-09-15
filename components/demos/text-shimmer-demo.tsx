import { TextShimmer } from "@/registry/mewo/ui/text-shimmer"
import type { PropDoc } from "./types"

export default function TextShimmerDemo() {
  return <TextShimmer className="text-4xl font-semibold tracking-tight">Shimmering text</TextShimmer>
}

export const props: PropDoc[] = [
  { name: "children", type: "string", description: "The text to render." },
  { name: "duration", type: "number", default: "2", description: "Seconds for one light sweep." },
  { name: "className", type: "string", description: "Merged onto the root span." },
]
