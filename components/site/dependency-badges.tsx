import { Package } from "lucide-react"

const badgeClass = "inline-flex items-center gap-1.5 rounded-lg border bg-card/60 px-2.5 py-1 text-xs"

export function DependencyBadges({ dependencies = [] }: { dependencies?: string[] }) {
  if (dependencies.length === 0) {
    return <span className={`${badgeClass} text-muted-foreground`}>No dependencies</span>
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {dependencies.map((dep) => (
        <li key={dep} className={`${badgeClass} font-mono`}>
          <Package className="size-3.5 text-brand-text" aria-hidden />
          {dep}
        </li>
      ))}
    </ul>
  )
}
