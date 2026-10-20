import { Sidebar } from "@/components/site/sidebar"
import { getGroups, isDropIn } from "@/lib/registry"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const groups = getGroups().map((group) => ({
    group: group.group,
    label: group.label,
    items: group.items.map((item) => ({
      name: item.name,
      title: item.title,
      badge: isDropIn(item) ? "Drop-in" : undefined,
    })),
  }))

  return (
    <div className="mx-auto grid w-full max-w-360 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
      <aside className="lg:sticky lg:top-22 lg:h-[calc(100dvh-7rem)] lg:self-start">
        <div className="h-full rounded-2xl border bg-card/50 p-2.5">
          <Sidebar groups={groups} />
        </div>
      </aside>
      <div className="min-w-0 lg:py-4">{children}</div>
    </div>
  )
}
