export function DependencyBadges({ dependencies = [] }: { dependencies?: string[] }) {
  if (dependencies.length === 0) {
    return <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">No dependencies</span>
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {dependencies.map((dep) => (
        <li key={dep} className="rounded-full border bg-muted/40 px-2.5 py-0.5 font-mono text-xs">
          {dep}
        </li>
      ))}
    </ul>
  )
}
