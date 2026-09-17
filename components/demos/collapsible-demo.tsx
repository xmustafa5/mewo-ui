import { ChevronsUpDown } from "lucide-react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/registry/mewo/ui/collapsible"
import type { PropDoc } from "./types"

export default function CollapsibleDemo() {
  return (
    <Collapsible className="flex w-full max-w-sm flex-col rounded-lg border p-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md text-left text-sm font-medium outline-none transition-colors hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50">
        What does this replace?
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3 text-sm text-muted-foreground">
          <p>shadcn&apos;s collapsible renders the Base UI panel with no styling and no animation, so it appears at full height instantly.</p>
          <p className="mt-2">This one animates its height and fades the content in.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const props: PropDoc[] = [
  { name: "open", type: "boolean", description: "Controlled open state. On Collapsible." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Uncontrolled initial state. On Collapsible." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the panel opens or closes." },
  { name: "className", type: "string", description: "Merged onto any part." },
]
