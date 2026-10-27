"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Search as SearchIcon } from "lucide-react"
import { AllIcon, GROUP_ICONS } from "@/components/site/icons"
import { SidebarPreview, useSidebarPreview } from "@/components/site/sidebar-preview"
import type { Group } from "@/lib/registry"
import { cn } from "@/lib/utils"

export type SidebarItem = { name: string; title: string; badge?: string; hasPreview?: boolean }

export type SidebarGroup = {
  group: string
  label: string
  items: SidebarItem[]
}

const CATALOG_PATH = "/docs/components"
const CATEGORY_PATH = "/docs/category/"

/** The pages above the components, like React Bits' "Get Started" group. */
const START = {
  group: "start",
  label: "Get started",
  links: [
    { href: "/docs", title: "Introduction" },
    { href: "/sites", title: "Sites" },
    { href: "/studio", title: "Background Studio" },
  ],
}

/** Pixels of fade at each end of the list while there is more to scroll that way. */
const FADE_TOP = 28
const FADE_BOTTOM = 38

/** Fades whichever end of the list has more behind it. Written straight to the style, so scrolling never renders. */
function updateEdges(list: HTMLElement) {
  const below = list.scrollHeight - list.scrollTop - list.clientHeight
  list.style.setProperty("--fade-top", `${list.scrollTop > 2 ? FADE_TOP : 0}px`)
  list.style.setProperty("--fade-bottom", `${below > 8 ? FADE_BOTTOM : 0}px`)
}

function Badge({ children }: { children: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "ml-[7px] inline-flex h-4 items-center rounded px-[5px] text-[9px] leading-none font-semibold tracking-[0.01em]",
        children === "New" ? "bg-brand/15 text-brand-text" : "bg-accent text-muted-foreground",
      )}
    >
      {children}
    </span>
  )
}

const itemClass = (active: boolean) =>
  cn(
    "flex items-center py-[0.15em] text-[0.85rem] transition-[color,transform] duration-200",
    active
      ? "w-fit font-medium text-brand-text"
      : "text-muted-foreground hover:translate-x-0.5 hover:text-foreground motion-reduce:hover:translate-x-0",
  )

/**
 * The docs navigation, built like React Bits' sidebar: a link to the whole catalog, a category picker that
 * opens one category's page and narrows the list to it, a filter, and the list itself. Resting on an item
 * plays its catalog clip beside the sidebar.
 */
export function Sidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  // Below the lg breakpoint the list folds away behind a toggle; from lg up it is always shown.
  const [expanded, setExpanded] = React.useState(false)
  const [tip, setTip] = React.useState<{ label: string; x: number; y: number } | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const preview = useSidebarPreview()

  // A category page sets the focus. Opening one of its items keeps it; going anywhere else lets it go.
  const routeFocus = pathname.startsWith(CATEGORY_PATH) ? pathname.slice(CATEGORY_PATH.length) : null
  const [focus, setFocus] = React.useState(routeFocus)
  const [seenPath, setSeenPath] = React.useState(pathname)
  if (seenPath !== pathname) {
    setSeenPath(pathname)
    const owner = groups.find((group) => group.items.some((item) => `/docs/${item.name}` === pathname))?.group
    setFocus(routeFocus ?? (owner !== undefined && owner === focus ? focus : null))
  }

  const total = groups.reduce((count, group) => count + group.items.length, 0)
  const focused = groups.find((group) => group.group === focus)
  const needle = query.trim().toLowerCase()
  const matches = (text: string) => text.toLowerCase().includes(needle)
  const startLinks = START.links.filter((link) => matches(link.title))
  const visible = groups
    .filter((group) => !focused || group.group === focused.group)
    .map((group) => ({ ...group, items: matches(group.label) ? group.items : group.items.filter((item) => matches(item.title)) }))
    .filter((group) => group.items.length > 0)

  const picker = [
    { key: null, label: "All", Icon: AllIcon },
    ...groups.map((group) => ({ key: group.group, label: group.label, Icon: GROUP_ICONS[group.group as Group] ?? AllIcon })),
  ]
  const pickerIndex = Math.max(
    0,
    picker.findIndex((option) => option.key === (focused?.group ?? null)),
  )

  const pick = (key: string | null) => {
    setTip(null)
    setFocus(key)
    if (key) {
      if (pathname !== `${CATEGORY_PATH}${key}`) router.push(`${CATEGORY_PATH}${key}`)
    } else if (routeFocus) {
      router.push(CATALOG_PATH)
    }
  }

  const showTip = (label: string, event: React.SyntheticEvent<HTMLElement>) => {
    const item = event.currentTarget.getBoundingClientRect()
    const nav = event.currentTarget.closest("nav")?.getBoundingClientRect()
    setTip({ label, x: (nav?.right ?? item.right) + 10, y: item.top + item.height / 2 })
  }

  // Keep the list's fades right as it is filtered, resized or loaded.
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(() => updateEdges(list))
    observer.observe(list)
    if (list.firstElementChild) observer.observe(list.firstElementChild)
    return () => observer.disconnect()
  }, [])

  // Bring the current page's link into view when it is out of sight.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const list = listRef.current
      const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
      if (!list || !active) return
      const box = list.getBoundingClientRect()
      const at = active.getBoundingClientRect()
      if (at.top < box.top + 60 || at.bottom > box.bottom - 60) {
        list.scrollTo({ top: list.scrollTop + (at.top - box.top) - 100, behavior: "smooth" })
      }
    }, 100)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const onCatalog = pathname === CATALOG_PATH
  const nothing = startLinks.length === 0 && visible.length === 0

  return (
    <nav aria-label="Documentation" className="flex h-full flex-col text-sm">
      <Link
        href={CATALOG_PATH}
        aria-current={onCatalog ? "page" : undefined}
        tabIndex={onCatalog ? -1 : undefined}
        className={cn(
          "mx-3.5 mb-2.5 flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-accent/70 px-[11px] text-[12.5px] font-medium tracking-[-0.01em] transition-[background-color,color,transform] duration-150 hover:bg-accent active:scale-[0.985] motion-reduce:transition-none",
          onCatalog && "pointer-events-none text-muted-foreground",
        )}
      >
        <AllIcon className="size-[13px] text-muted-foreground" aria-hidden />
        {onCatalog ? "Viewing all components" : "Browse all components"}
      </Link>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="mx-3.5 mb-3.5 flex items-center justify-between rounded-[10px] border px-3 py-2 font-medium lg:hidden"
      >
        Components
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>

      <div className={cn("flex min-h-0 flex-1 flex-col", !expanded && "max-lg:hidden")}>
        <div
          role="group"
          aria-label="Category"
          onPointerLeave={() => setTip(null)}
          className="relative mx-3.5 mb-2.5 grid shrink-0 gap-0.5 rounded-[10px] border bg-background/60 p-[3px]"
          style={{ gridTemplateColumns: `repeat(${picker.length}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-[3px] left-[3px] rounded-[7px] bg-accent transition-transform duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{
              width: `calc((100% - 6px - ${2 * (picker.length - 1)}px) / ${picker.length})`,
              transform: `translateX(calc(${pickerIndex} * (100% + 2px)))`,
            }}
          />
          {picker.map(({ key, label, Icon }, index) => (
            <button
              key={label}
              type="button"
              aria-label={key ? label : "All categories"}
              aria-pressed={index === pickerIndex}
              onClick={() => pick(key)}
              onPointerEnter={(event) => showTip(label, event)}
              onFocus={(event) => showTip(label, event)}
              onBlur={() => setTip(null)}
              className={cn(
                "relative z-10 grid h-8 place-items-center rounded-[7px] transition-[color,transform] duration-150 active:scale-[0.94]",
                index === pickerIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[17px]" strokeWidth={1.8} aria-hidden />
            </button>
          ))}
        </div>

        <label className="mx-3.5 mb-[18px] flex h-[34px] shrink-0 items-center gap-[7px] rounded-[9px] border bg-background/60 px-2.5 text-muted-foreground transition-colors focus-within:border-ring">
          <SearchIcon className="size-[13px] shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${focused ? focused.items.length : total} components...`}
            aria-label="Filter components"
            className="w-full min-w-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div
          ref={listRef}
          onScroll={(event) => updateEdges(event.currentTarget)}
          className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 var(--fade-top, 0px), #000 calc(100% - var(--fade-bottom, 0px)), transparent 100%)",
          }}
        >
          <div className="space-y-4">
            {startLinks.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold tracking-[-0.03em] text-muted-foreground/65 select-none">
                  {START.label}
                </p>
                <ul className="space-y-0.5">
                  {startLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={pathname === link.href ? "page" : undefined}
                        className={itemClass(pathname === link.href)}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {visible.map((group) => (
              <div key={group.group}>
                <p className="mb-2 text-sm font-semibold tracking-[-0.03em] text-muted-foreground/65 select-none">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const href = `/docs/${item.name}`
                    const active = pathname === href
                    return (
                      <li key={item.name}>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={itemClass(active)}
                          {...(item.hasPreview
                            ? preview.handlers({ name: item.name, title: item.title, label: group.label })
                            : {})}
                        >
                          {item.title}
                          {item.badge ? <Badge>{item.badge}</Badge> : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}

            {nothing ? <p className="py-5 text-center text-xs text-muted-foreground">No components match.</p> : null}
          </div>
        </div>
      </div>

      {tip
        ? createPortal(
            <div
              aria-hidden
              className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-lg border bg-card px-2.5 py-1.5 text-xs leading-none font-medium whitespace-nowrap shadow-sm"
              style={{ left: tip.x, top: tip.y }}
            >
              {tip.label}
            </div>,
            document.body,
          )
        : null}
      <SidebarPreview preview={preview} />
    </nav>
  )
}
