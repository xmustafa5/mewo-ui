import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { GROUP_ICONS } from "@/components/site/icons"
import { PixelSteps } from "@/components/site/mewo-mark"
import { getDependencies, getGroups, getItems, isDropIn } from "@/lib/registry"

export const metadata: Metadata = {
  title: "All components",
  description: "Every mewo component and section, grouped by category.",
}

export default function ComponentsPage() {
  const groups = getGroups()

  return (
    <div className="space-y-14">
      <header>
        <p className="text-sm font-medium text-brand-text">Catalog</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">All components</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {getItems().length} animated components and sections in {groups.length} categories. Each one installs with a
          single command and respects reduced motion.
        </p>
      </header>

      {groups.map((group) => {
        const Icon = GROUP_ICONS[group.group]
        return (
          <section key={group.group} aria-labelledby={`group-${group.group}`} className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-card/60">
                <Icon className="size-4 text-brand-text" aria-hidden />
              </span>
              <h2 id={`group-${group.group}`} className="text-xl font-semibold tracking-tight">
                {group.label}
              </h2>
              <span className="text-sm text-muted-foreground">{group.items.length}</span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((item) => {
                const dependencies = getDependencies(item)
                return (
                  <li key={item.name}>
                    <Link
                      href={`/docs/${item.name}`}
                      className="group flex h-full flex-col rounded-2xl border bg-card/40 p-1.5 transition-colors hover:border-brand/50 hover:bg-card"
                    >
                      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl border bg-background/60 bg-dots">
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,color-mix(in_oklch,var(--brand)_35%,transparent),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <Icon className="relative size-8 text-muted-foreground transition-colors group-hover:text-brand-text" aria-hidden />
                        <PixelSteps className="absolute right-3 bottom-3 size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.title}</h3>
                          {isDropIn(item) ? (
                            <span className="rounded-md border px-1.5 py-px text-[10px] leading-4 font-medium text-muted-foreground">
                              Drop-in
                            </span>
                          ) : null}
                          <ArrowUpRight
                            className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                            aria-hidden
                          />
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                        <p className="mt-auto pt-1 font-mono text-xs text-muted-foreground/80">
                          {dependencies.length > 0 ? dependencies.join(" · ") : "no dependencies"}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
