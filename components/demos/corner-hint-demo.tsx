import { CornerHint } from "@/registry/mewo/ui/corner-hint"
import type { PropDoc } from "./types"

export default function CornerHintDemo() {
  return (
    // a transformed box contains the hint's fixed position, so the demo stays in its frame
    <div className="w-full relative h-[50vh] overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]">
      <CornerHint />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "hint", type: "{ desktop: string; mobile: string }", default: "placeholders", description: "The hint on wide and narrow screens." },
  { name: "message", type: "string", description: "Replaces the hint while set (e.g. the name of a picked object), and shows even when show is false." },
  { name: "show", type: "boolean", default: "true", description: "Whether the hint shows; it grows in from a little larger as it fades in." },
  { name: "className", type: "string", description: "Merged onto the hint." },
]
