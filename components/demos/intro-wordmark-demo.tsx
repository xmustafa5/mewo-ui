import { IntroWordmarkLoop } from "./intro-wordmark-loop"
import type { PropDoc } from "./types"

export default function IntroWordmarkDemo() {
  return (
    // half light, half dark: the difference blend turns the name dark on one side and light on the other
    <div className="relative h-[50vh] overflow-hidden rounded-xl border bg-[linear-gradient(90deg,#e6e0dc_50%,#1d1d1f_50%)] [container-type:size] [contain:layout]">
      <IntroWordmarkLoop />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "stage", type: '"hidden" | "center" | "top"', default: '"top"', description: "Before the intro, while the page loads (mid-screen), and once it has moved up to the top centre." },
  { name: "atTop", type: "boolean", default: "true", description: "At the very top of the page. Scrolled away, it hides on wide screens (a Corner Wordmark takes over); phones keep it." },
  { name: "children", type: "ReactNode", default: '"Atlas"', description: "The name." },
  { name: "className", type: "string", description: "Merged onto the wordmark. Give it no positioned wrapper, or the blend has nothing to blend with." },
]
