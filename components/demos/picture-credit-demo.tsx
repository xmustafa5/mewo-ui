import { PictureCredit } from "@/registry/mewo/ui/picture-credit"
import type { PropDoc } from "./types"

export default function PictureCreditDemo() {
  return (
    <div className="[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] flex justify-center py-12">
      <PictureCredit title="A carved vessel" by="c. 3000 BCE" line="A museum somewhere. Placeholder photograph, CC BY 4.0." href="#" className="w-[calc(var(--story-u)*37)] max-w-full" />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "title", type: "string", default: '"An old vessel"', description: "The picture's name, underlined (linked when href is set)." },
  { name: "by", type: "string", default: '"c. 3000 BCE"', description: "Place and date, after the name." },
  { name: "line", type: "string", default: "a placeholder credit", description: "The small grey line: where it is kept, the photograph's credit and licence." },
  { name: "href", type: "string", description: "Where the name links; it opens in a new tab." },
  { name: "className", type: "string", description: "Merged onto the paragraph: its width, say." },
]
