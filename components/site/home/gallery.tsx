import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { demos } from "@/components/demos"
import { GROUP_LABELS, getItem, type Group } from "@/lib/registry"
import { cn } from "@/lib/utils"

/** The live demos on the home page, laid out two over three: a background, a card, two texts and a 3D card. */
const TILES = [
  { name: "grainient", span: "lg:col-span-7" },
  { name: "spotlight-card", span: "lg:col-span-5" },
  { name: "split-text", span: "lg:col-span-4" },
  { name: "text-shimmer", span: "lg:col-span-4" },
  { name: "depth-card", span: "lg:col-span-4" },
]

export async function Gallery() {
  const tiles = await Promise.all(
    TILES.map(async (tile) => {
      const item = getItem(tile.name)
      const load = demos[tile.name]
      if (!item || !load) return null
      const { default: Demo } = await load()
      return { ...tile, item, Demo }
    })
  )

  return (
    <section aria-labelledby="gallery-heading" className="border-y border-border/70 bg-card/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand-text">Live</p>
            <h2 id="gallery-heading" className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              See them in action
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Real components running on this page, as they would in yours. Move the pointer over them.
            </p>
          </div>
          <Link
            href="/docs/components"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {tiles.map((tile) => {
            if (!tile) return null
            const { item, Demo } = tile
            const group = item.categories?.[0] as Group | undefined
            return (
              <div key={item.name} className={cn("flex flex-col rounded-2xl border bg-card/50 p-1.5", tile.span)}>
                <div className="flex min-h-80 flex-1 items-center justify-center overflow-hidden rounded-xl border bg-background/60 bg-dots p-6">
                  <Demo />
                </div>
                <Link href={`/docs/${item.name}`} className="group flex items-center justify-between gap-3 px-3 py-3.5">
                  <span className="font-semibold tracking-tight">{item.title}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {group ? GROUP_LABELS[group] : "Component"}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
