import { PictureFigure } from "@/registry/mewo/ui/picture-figure"
import type { PropDoc } from "./types"

const caption = (text: string) => <p className="text-center text-[length:max(12px,calc(var(--story-u)*1.2))] text-muted-foreground">{text}</p>

export default function PictureFigureDemo() {
  return (
    <div className="[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] flex flex-wrap items-start justify-center gap-[calc(var(--story-u)*6)] pt-12 pb-24">
      <PictureFigure src="https://picsum.photos/seed/mewo-picture-figure-2/740/1000" ratio={740 / 1000} className="h-[calc(var(--story-u)*32)]" caption={caption("A portrait, about 3 : 4")} />
      <PictureFigure src="https://picsum.photos/seed/mewo-picture-figure-3/1000/980" ratio={1000 / 980} className="h-[calc(var(--story-u)*24)]" caption={caption("A carved disc, nearly square")} />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "src / alt", type: "string / string", default: "a placeholder photo", description: "The picture." },
  { name: "ratio", type: "number", default: "4 / 5", description: "Width ÷ height of the frame. Its height comes from className." },
  { name: "caption", type: "ReactNode", description: "Hangs under the picture, centred and at least 32rem wide, taking no room (a credit, say)." },
  { name: "className", type: "string", description: "Merged onto the figure: give it its height here." },
]
