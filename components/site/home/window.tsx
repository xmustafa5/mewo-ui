import { cn } from "@/lib/utils"

/** An app-window frame — title bar with traffic lights — for code, terminal and preview panes. */
export function Window({
  title,
  children,
  className,
  bodyClassName,
}: {
  title: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card/85 shadow-2xl shadow-black/25 backdrop-blur-xl",
        className
      )}
    >
      <div className="relative flex h-10 shrink-0 items-center justify-center border-b text-xs text-muted-foreground">
        <div aria-hidden className="absolute left-4 flex gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        {title}
      </div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  )
}
