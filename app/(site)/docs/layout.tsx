import { Sidebar } from "@/components/site/sidebar"
import { getGroups } from "@/lib/registry"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const groups = getGroups().map((group) => ({
    group: group.group,
    label: group.label,
    items: group.items.map((item) => ({ name: item.name, title: item.title })),
  }))

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 md:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="md:sticky md:top-20 md:self-start">
        <Sidebar groups={groups} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
