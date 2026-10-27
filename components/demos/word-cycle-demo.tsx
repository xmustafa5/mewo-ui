import { WordCycle } from "@/registry/mewo/ui/word-cycle"
import type { PropDoc } from "./types"

export default function WordCycleDemo() {
  return (
    <p className="font-heading text-5xl">
      A long view of the <WordCycle words={["political", "economic", "religious", "cultural"]} /> forces.
    </p>
  )
}

export const props: PropDoc[] = [
  { name: "words", type: "string[]", default: '["political", "economic", "cultural"]', description: "The words, shown one at a time in place." },
  { name: "interval", type: "number", default: "2200", description: "Milliseconds each word stays." },
  { name: "className", type: "string", description: "Merged onto the inline grid." },
]
