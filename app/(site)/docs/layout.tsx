import { DocsRail } from "@/components/site/docs-rail"
import { Sidebar } from "@/components/site/sidebar"
import { hasPreview } from "@/lib/catalog"
import { getGroups, getItems, isDropIn, isNew } from "@/lib/registry"

/**
 * The docs shell, measured from React Bits': a 256px sidebar 16px from the left edge, a 300px rail 32px
 * from the right, and the page centred between them up to 1080px. The rail needs 1320px of window; below
 * that it drops under the page, and below lg it goes, as React Bits' does.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const groups = getGroups().map((group) => ({
    group: group.group,
    label: group.label,
    items: group.items.map((item) => ({
      name: item.name,
      title: item.title,
      badge: isDropIn(item) ? "Drop-in" : isNew(item) ? "New" : undefined,
      hasPreview: hasPreview(item.name),
    })),
  }))

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 pt-4 pb-12 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:content-start lg:gap-x-8 lg:gap-y-12 lg:pr-8 rail:grid-cols-[16rem_minmax(0,1fr)_18.75rem]">
      <aside className="lg:sticky lg:top-20 lg:row-span-2 lg:h-[calc(100dvh-6rem)] lg:self-start rail:row-span-1">
        <div className="h-full overflow-hidden rounded-2xl border bg-card/80 pt-3.5 shadow-[0_14px_40px_rgb(24_24_27/0.08)] backdrop-blur-xl">
          <Sidebar groups={groups} />
        </div>
      </aside>
      <div className="mx-auto w-full max-w-[67.5rem] min-w-0 lg:pt-4">{children}</div>
      <aside className="mx-auto w-full max-w-[67.5rem] max-lg:hidden rail:sticky rail:top-20 rail:col-start-3 rail:row-start-1 rail:max-h-[calc(100dvh-6rem)] rail:max-w-none rail:self-start rail:overflow-y-auto rail:[scrollbar-width:none]">
        <DocsRail itemNames={getItems().map((item) => item.name)} />
      </aside>
    </div>
  )
}
