import { DocsRail } from "@/components/site/docs-rail"
import { Sidebar } from "@/components/site/sidebar"
import { getGroups, getItems, isDropIn, isNew } from "@/lib/registry"

/**
 * The docs shell, laid out like React Bits': the navigation flush left, the page centred in what is left,
 * and a rail of cards flush right on wide screens.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const groups = getGroups().map((group) => ({
    group: group.group,
    label: group.label,
    items: group.items.map((item) => ({
      name: item.name,
      title: item.title,
      badge: isDropIn(item) ? "Drop-in" : isNew(item) ? "New" : undefined,
    })),
  }))

  return (
    <div className="grid w-full flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[13rem_minmax(0,1fr)_15rem]">
      <aside className="lg:sticky lg:top-22 lg:h-[calc(100dvh-7rem)] lg:self-start">
        <div className="h-full rounded-2xl border bg-card/50 p-2.5">
          <Sidebar groups={groups} />
        </div>
      </aside>
      <div className="mx-auto w-full max-w-[54rem] min-w-0 lg:py-2">{children}</div>
      <aside className="max-xl:hidden xl:sticky xl:top-22 xl:self-start">
        <DocsRail itemNames={getItems().map((item) => item.name)} />
      </aside>
    </div>
  )
}
