import { ChapterNavLive } from "./chapter-nav-live"
import type { PropDoc } from "./types"

export default function ChapterNavDemo() {
  return (
    // a transformed box contains the nav's fixed pieces, so the demo stays in its frame
    <div className="relative w-full h-[70vh] overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]">
      <ChapterNavLive />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "chapters", type: "{ title: string; start: number }[]", default: "three chapters", description: "The chapters in order; start is where each begins, in viewport heights of the story." },
  { name: "bounds", type: "number[]", default: "the chapters' starts", description: "Chapter boundaries for the dots, one more than the chapters: dot i fills from bounds[i] to bounds[i + 1]." },
  { name: "progress", type: "number", default: "0", description: "The reader's position, in the same unit as the starts. The current chapter's dot stretches and fills." },
  { name: "title", type: "string", default: '"Chapters"', description: "The panel's heading." },
  { name: "brand", type: "string", default: '"Atlas"', description: "The wordmark at the foot of the panel." },
  { name: "copyright", type: "string", default: '"© Atlas"', description: "The small line under the wordmark." },
  { name: "visible", type: "boolean", default: "true", description: "The dots fade in once true (e.g. when an intro ends)." },
  { name: "open", type: "boolean", description: "Whether the panel is open, to control it from the page (one panel at a time beside a header). Left out, the nav keeps its own state." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the panel opens or closes; pair it with open." },
  { name: "onChapter", type: "(start: number) => void", description: "Called with a chapter's start when the reader picks it; the page scrolls there." },
  { name: "labels", type: "{ chapters; close }", default: "English", description: "Accessible names, in the page's language." },
  { name: "className", type: "string", description: "Merged onto the root (display: contents)." },
]
