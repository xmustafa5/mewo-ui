import { PictureFigure } from "@/registry/mewo/ui/picture-figure"
import { optimized } from "./cat-pictures"
import type { PropDoc } from "./types"

const caption = (text: string) => <p className="text-center text-[length:max(12px,calc(var(--story-u)*1.2))] text-muted-foreground">{text}</p>

export default function PictureFigureDemo() {
  return (
    <div className="[--story-u:min(2.6667cqw,12px)] flex flex-wrap items-start justify-center gap-[calc(var(--story-u)*6)] pt-12 pb-24">
      <PictureFigure src={optimized("https://cataas.com/cat/C5Ddbc1ilh45jiAk", 1080)} ratio={810 / 1080} className="h-[calc(var(--story-u)*32)]" caption={caption("A portrait, about 3 : 4")} />
      <PictureFigure src={optimized("https://cataas.com/cat/1wpap8yckt96vOoU", 1080)} ratio={1125 / 1095} className="h-[calc(var(--story-u)*24)]" caption={caption("A carved disc, nearly square")} />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "src / alt", type: "string / string", default: "a placeholder photo", description: "The picture." },
  { name: "ratio", type: "number", default: "4 / 5", description: "Width ÷ height of the frame. Its height comes from className." },
  { name: "caption", type: "ReactNode", description: "Hangs under the picture, centred and at least 32rem wide, taking no room (a credit, say)." },
  { name: "className", type: "string", description: "Merged onto the figure: give it its height here." },
]
