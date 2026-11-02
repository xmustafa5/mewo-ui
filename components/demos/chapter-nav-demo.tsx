import { cn } from "@/lib/utils"
import { ChapterNavLive } from "./chapter-nav-live"
import type { PropDoc } from "./types"

export default function ChapterNavDemo() {
  return (
    // a layout-contained box holds the nav's fixed pieces, so the demo stays in its frame. The demo shows the nav larger
    // and in the middle: the rail centred, the panel centred on it and opening out of it, on a soft gradient in each
    // theme's colours (on a page the nav keeps to the inline end, at its own size)
    <div
      className={cn(
        "relative h-[70vh] w-full overflow-hidden rounded-xl border [container-type:size] [contain:layout]",
        "bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] dark:bg-[linear-gradient(135deg,#2b2e3b,#181b25)]",
        // the rail at its own unit; the panel's unit also keeps it inside the box's height
        "[&>[data-slot=chapter-nav]]:[--rail-u:min(14px,1.6cqw)]",
        "[&>[data-slot=chapter-nav]>button]:[--story-u:var(--rail-u)]!",
        "[&>[data-slot=chapter-nav]>section]:[--story-u:min(14px,1.6cqw,2.1cqh)]!",
        "[&>[data-slot=chapter-nav]>button]:end-[calc(50%-var(--story-u)*2)]!",
        "[&>[data-slot=chapter-nav]>section]:end-[calc(50%-var(--story-u)*25.4)]!",
        // closed, the panel's clip is the rail it opens out of, in the middle
        "[&>[data-slot=chapter-nav]>section]:[clip-path:inset(calc((50%-var(--rail-u)*4.5)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*2)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*4.5)*(1-var(--chapter-nav-reveal)))_calc((50%-var(--rail-u)*2)*(1-var(--chapter-nav-reveal)))_round_calc(var(--story-u)*1.2))]!",
      )}
    >
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
