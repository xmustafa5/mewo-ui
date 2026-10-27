import { DateTimeline } from "@/registry/mewo/ui/date-timeline"
import type { StageTrackSet } from "@/registry/mewo/ui/scroll-stage"
import { StageFrame } from "./stage-frame"
import tracks from "./date-timeline-tracks.json"
import type { PropDoc } from "./types"

export default function DateTimelineDemo() {
  // the line slides its gap to each date as the story is read: scroll inside the frame. The stage is twice the
  // frame's width, so the timeline in its middle shows at about its size on a wide page
  return (
    <StageFrame tracks={tracks as unknown as StageTrackSet} length={10.3} scale={2}>
      <DateTimeline track="a1" dates={["c. 3000 BCE", "c. 2300 BCE", "1850s", "1920s", "1930s", "Today"]} />
    </StageFrame>
  )
}

export const props: PropDoc[] = [
  { name: "dates", type: "string[]", default: "three dates", description: "The dates, in order." },
  { name: "track", type: "string", description: "The track names' prefix inside a ScrollStage: <track>.timeline, <track>.timelineLine and <track>.year<i>." },
  { name: "className", type: "string", description: "Merged onto the root (display: contents)." },
]
