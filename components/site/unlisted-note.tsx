import { cn } from "@/lib/utils"

/**
 * An unlisted item is a simple piece that ships with a site built with mewo. It has its page and installs like
 * any item, but the catalog, the sidebar, search and the counts leave it out, so a visitor who lands on its page
 * is told why it is not in the list.
 */
export function UnlistedNote({ className }: { className?: string }) {
  return (
    <div role="note" data-slot="unlisted-note" className={cn("rounded-lg border bg-card/60 px-4 py-3 text-sm", className)}>
      <p className="font-medium">Not in the components list.</p>
      <p className="mt-1 text-muted-foreground">
        This is a simple piece that ships with a site built with mewo. It installs like any other item, but the
        catalog, the sidebar and search leave it out.
      </p>
    </div>
  )
}
