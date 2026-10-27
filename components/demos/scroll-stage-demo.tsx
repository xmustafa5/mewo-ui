import { ScrollStage, type StageLayout, type StageTrackSet } from "@/registry/mewo/ui/scroll-stage"
import type { PropDoc } from "./types"

// A title that rises and shrinks over two viewport heights of scrolling, and a caption that fades in by time.
// Positions are in the window's vw / vh (the stage is normally fixed full-screen), so they sit left of centre here.
const tracks: Partial<Record<StageLayout, StageTrackSet>> = {
  desktop: {
    title: { size: [320, 120], keys: [[0, 22, 40, 1, 1], [1, 22, 22, 0.6, 1], [2, 22, 10, 0.4, 0]] },
    caption: { size: [280, 60], keys: [[0, 22, 62, 1]], on: [[0.3, 1.6]] },
  },
}

export default function ScrollStageDemo() {
  return (
    // a transformed box contains the stage's fixed layer, so the demo stays in its frame; scroll the page to play it
    <div className="w-full relative h-[70vh] overflow-hidden rounded-xl border [container-type:size] [contain:layout]">
      <ScrollStage tracks={{ ...tracks, tablet: tracks.desktop, phone: tracks.desktop }} length={2} className="bg-muted/40">
        <h3 data-track="title" className="w-[320px] text-center font-heading text-5xl">
          Scroll the page
        </h3>
        <p data-track="caption" data-entrance className="w-[280px] text-center text-lg text-muted-foreground">
          This line fades in by time once you pass a point.
        </p>
      </ScrollStage>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "tracks", type: "Partial<Record<\"desktop\" | \"tablet\" | \"phone\", StageTrackSet>>", default: "a two-piece demo", description: "Keyframes per layout: for each data-track name, its measured size, keys [vh, cx vw%, cy vh%, scale, opacity?] and optional time-based fade windows (on)." },
  { name: "length", type: "number", default: "3", description: "Length of the story in viewport heights; the page must be at least this tall." },
  { name: "queries", type: "Partial<Record<layout, string>>", default: "desktop above 900px, tablet / phone below (aspect 13/20)", description: "Media queries that choose each layout's track set." },
  { name: "mirror", type: "boolean", default: "false", description: "Mirror every piece left to right, for right-to-left pages." },
  { name: "className", type: "string", description: "Merged onto the fixed stage." },
]
