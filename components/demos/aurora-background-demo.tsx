import { AuroraBackground } from "@/registry/mewo/ui/aurora-background"
import type { PropDoc } from "./types"

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground className="min-h-[320px] w-full rounded-lg">
      <h2 className="text-3xl font-bold tracking-tight">Aurora</h2>
      <p className="mt-2 text-muted-foreground">A backdrop for heroes and section headers.</p>
    </AuroraBackground>
  )
}

export const props: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "Content rendered above the aurora, faded in on mount." },
  { name: "showRadialMask", type: "boolean", default: "true", description: "Fade the aurora out towards the bottom-left." },
  { name: "className", type: "string", description: "Merged onto the root element." },
]
