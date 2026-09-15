import { SplitText } from "@/registry/mewo/ui/split-text"
import type { PropDoc } from "./types"

export default function SplitTextDemo() {
  return (
    <SplitText as="h2" by="words" stagger={0.08} className="max-w-md text-center text-4xl font-bold tracking-tight">
      Words that arrive one at a time
    </SplitText>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "string", description: "The text to split and animate." },
  { name: "by", type: '"chars" | "words"', default: '"chars"', description: "Split granularity." },
  { name: "stagger", type: "number", default: "0.03", description: "Seconds between each unit." },
  { name: "delay", type: "number", default: "0", description: "Seconds before the first unit." },
  { name: "once", type: "boolean", default: "true", description: "Play once, or replay on every scroll into view." },
  { name: "as", type: '"span" | "h1" | "h2" | "h3" | "p"', default: '"span"', description: "Element to render." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
