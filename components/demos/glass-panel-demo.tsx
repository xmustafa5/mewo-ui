import { GlassPanel, GlassPanelContent, GlassPanelFooter, GlassPanelTitle, GlassPanelTrigger } from "@/registry/mewo/ui/glass-panel"
import type { PropDoc } from "./types"

export default function GlassPanelDemo() {
  return (
    // a transformed box contains the panel's fixed pieces, so the demo stays in its frame
    <div className="[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] relative h-[70vh] overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#e6e0dc,#dae2e8)] [container-type:size] [contain:layout]">
      <GlassPanel defaultOpen>
        <GlassPanelTrigger className="fixed top-[calc(var(--story-u)*2)] end-[calc(var(--story-u)*2)] grid size-[calc(var(--story-u)*4)] place-content-center gap-[calc(var(--story-u)*0.55)] rounded-sm bg-primary text-primary-foreground">
          <span className="block h-[2px] w-[calc(var(--story-u)*1.45)] rounded-[1px] bg-current" />
          <span className="block h-[2px] w-[calc(var(--story-u)*1.45)] rounded-[1px] bg-current" />
          <span className="sr-only">About this story</span>
        </GlassPanelTrigger>
        <GlassPanelContent>
          <GlassPanelTitle>About this story</GlassPanelTitle>
          <p className="font-heading text-[length:calc(var(--story-u)*2)] leading-[1.4]">A scroll story that follows objects, people and places through a long history.</p>
          <p className="text-[length:calc(var(--story-u)*1.4)] leading-[1.4] tracking-[-0.01em]">Pictures come from open collections, credited with each one.</p>
          <p className="text-[length:calc(var(--story-u)*1.4)] leading-[1.4] tracking-[-0.01em]">Close the panel and open it again: it grows out of its button.</p>
          <GlassPanelFooter>
            <span className="font-heading text-[length:calc(var(--story-u)*2)]">Atlas</span>
            <span className="text-[9px] opacity-50">© Atlas</span>
          </GlassPanelFooter>
        </GlassPanelContent>
      </GlassPanel>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open, details) => void", description: "Base UI's dialog state. On GlassPanel. Control it from the page to keep one panel open at a time." },
  { name: "container", type: "HTMLElement | RefObject | null", default: "beside the trigger", description: "Where the panel renders. On GlassPanelContent. Pass document.body to lift it out of a clipping parent." },
  { name: "showCloseButton", type: "boolean", default: "true", description: "The ✕ in the panel's corner. On GlassPanelContent." },
  { name: "closeLabel", type: "string", default: '"Close"', description: "The close button's accessible name, in the page's language. On GlassPanelContent." },
  { name: "initialFocus / finalFocus", type: "Base UI's", default: "[data-autofocus], else the close button / the trigger", description: "Where focus goes as it opens and closes. On GlassPanelContent. Only an open from the trigger takes focus (a panel open on load leaves it), and focus returns only when the panel closed itself." },
  { name: "className", type: "string", description: "Merged onto any part. The trigger has no look of its own; place it and style it here." },
]
