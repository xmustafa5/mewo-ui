"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_GROUPS, filterEntries, sortEntries, type CatalogEntry, type SortMode } from "./catalog-filter"
import { PreviewCard } from "./preview-card"
import { useNewSinceLastVisit } from "./use-new-since-last-visit"

const fieldClass =
  "h-9 rounded-xl border bg-card/60 text-sm outline-none transition-colors hover:bg-accent/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "w-full cursor-pointer appearance-none pr-8 pl-3 font-medium")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </label>
  )
}

/**
 * The catalog: one grid of every item, with search, a category and a sort, in the shape of React Bits'
 * component index. Items new since the visitor's last visit are badged and can be shown on their own.
 */
export function ComponentCatalog({
  entries,
  groups,
}: {
  entries: CatalogEntry[]
  groups: { value: string; label: string }[]
}) {
  const [query, setQuery] = React.useState("")
  const [group, setGroup] = React.useState(ALL_GROUPS)
  const [sort, setSort] = React.useState<SortMode>("newest")
  const [newOnly, setNewOnly] = React.useState(false)
  const names = React.useMemo(() => entries.map((entry) => entry.name), [entries])
  const unseen = useNewSinceLastVisit(names)

  const visible = React.useMemo(
    () => sortEntries(filterEntries(entries, { query, group, newOnly }, unseen), sort, unseen),
    [entries, query, group, newOnly, sort, unseen],
  )

  const filtering = query.trim().length > 0 || group !== ALL_GROUPS || newOnly
  const showUnseen = unseen.size > 0 && (!filtering || newOnly)
  const clear = () => {
    setQuery("")
    setGroup(ALL_GROUPS)
    setNewOnly(false)
  }

  return (
    <div className="@container space-y-6">
      <header className="flex flex-col gap-5 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div>
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em]">Components</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {showUnseen ? (
              <button
                type="button"
                aria-pressed={newOnly}
                onClick={() => setNewOnly((value) => !value)}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {newOnly ? visible.length : unseen.size} new since your last visit
              </button>
            ) : filtering ? (
              `${visible.length} ${visible.length === 1 ? "component" : "components"} found`
            ) : (
              `${entries.length} animated components and sections`
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 @xl:flex-row @xl:items-center">
          <label className="relative block @xl:w-56">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              aria-label="Search components"
              className={cn(fieldClass, "w-full pr-3 pl-8 placeholder:text-muted-foreground")}
            />
          </label>
          <SelectField
            label="Category"
            value={group}
            onChange={setGroup}
            options={[{ value: ALL_GROUPS, label: "All components" }, ...groups]}
            className="@xl:w-44"
          />
          <SelectField
            label="Sort"
            value={sort}
            onChange={(value) => setSort(value as SortMode)}
            options={[
              { value: "newest", label: "Newest" },
              { value: "az", label: "A to Z" },
            ]}
            className="@xl:w-32"
          />
          <button
            type="button"
            aria-label="Clear filters"
            title="Clear filters"
            onClick={clear}
            tabIndex={filtering ? 0 : -1}
            className={cn(
              fieldClass,
              "inline-flex w-9 shrink-0 items-center justify-center text-muted-foreground transition-[opacity,transform] hover:text-foreground",
              // Stacked on a narrow screen it would hold an empty row open, so it only takes space while needed.
              filtering ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0 @max-xl:hidden",
            )}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      {visible.length === 0 ? (
        <div role="status" className="py-24 text-center">
          <p className="text-2xl font-medium">No results...</p>
          <p className="mt-1 text-muted-foreground">Try adjusting your filters.</p>
          <button
            type="button"
            onClick={clear}
            className="mt-6 inline-flex h-9 items-center rounded-xl border bg-card/60 px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 @[30rem]:grid-cols-2 @[44rem]:grid-cols-3">
          {visible.map((entry) => (
            <li key={entry.name}>
              <PreviewCard
                entry={entry}
                badge={unseen.has(entry.name) ? "Since last visit" : entry.isNew ? "New" : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {visible.length > 0 ? (
        <details className="group rounded-2xl border bg-card/40 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground select-none hover:text-foreground">
            Browse by name
          </summary>
          <nav aria-label="Component directory" className="mt-3">
            <ul className="columns-2 gap-6 @xl:columns-3">
              {[...visible]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((entry) => (
                  <li key={entry.name} className="py-1">
                    <Link
                      href={`/docs/${entry.name}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </details>
      ) : null}
    </div>
  )
}
