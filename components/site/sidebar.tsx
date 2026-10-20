"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, ChevronDown, Search as SearchIcon, type LucideIcon } from "lucide-react"
import { AllIcon, GROUP_ICONS } from "@/components/site/icons"
import type { Group } from "@/lib/registry"
import { cn } from "@/lib/utils"

export type SidebarGroup = {
  group: string
  label: string
  items: { name: string; title: string; badge?: string }[]
}

function PageLink({ href, icon: Icon, active, children }: { href: string; icon: LucideIcon; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition-colors",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Link>
  )
}

export function Sidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<string | null>(null)
  // Below the lg breakpoint the list folds away behind a toggle; from lg up it is always shown.
  const [expanded, setExpanded] = React.useState(false)

  const total = groups.reduce((count, group) => count + group.items.length, 0)
  const needle = query.trim().toLowerCase()
  const visible = groups
    .filter((group) => category === null || group.group === category)
    .map((group) => ({ ...group, items: group.items.filter((item) => item.title.toLowerCase().includes(needle)) }))
    .filter((group) => group.items.length > 0)

  return (
    <nav aria-label="Documentation" className="flex h-full flex-col gap-3 text-sm">
      <div className="space-y-0.5">
        <PageLink href="/docs" icon={BookOpen} active={pathname === "/docs"}>
          Introduction
        </PageLink>
        <PageLink href="/docs/components" icon={AllIcon} active={pathname === "/docs/components"}>
          Browse all components
        </PageLink>
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex items-center justify-between rounded-xl border bg-background/60 px-3 py-2 font-medium lg:hidden"
      >
        Components
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>

      <div className={cn("flex min-h-0 flex-1 flex-col gap-3", !expanded && "max-lg:hidden")}>
        <div role="group" aria-label="Filter by category" className="flex gap-0.5 rounded-xl border bg-background/60 p-1">
          {[{ group: null, label: "All categories", Icon: AllIcon }, ...groups.map((g) => ({ group: g.group, label: g.label, Icon: GROUP_ICONS[g.group as Group] ?? AllIcon }))].map(
            ({ group, label, Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={category === group}
                onClick={() => setCategory(group)}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center rounded-lg transition-colors",
                  category === group
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            )
          )}
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${total} components…`}
            aria-label="Filter components"
            className="h-9 w-full rounded-xl border bg-background/60 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>

        <div className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2 pb-2 scrollbar-thin">
          {visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-muted-foreground">No components match.</p>
          ) : (
            visible.map((group) => (
              <div key={group.group}>
                <p className="mb-1.5 px-3 text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const href = `/docs/${item.name}`
                    const active = pathname === href
                    return (
                      <li key={item.name}>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors",
                            active
                              ? "bg-accent font-medium text-brand-text"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          )}
                        >
                          {active ? <span aria-hidden className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" /> : null}
                          {item.title}
                          {item.badge ? (
                            <span aria-hidden className="rounded-md border px-1.5 py-px text-[10px] leading-4 font-medium text-muted-foreground">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </nav>
  )
}
