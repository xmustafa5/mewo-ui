import Link from "next/link"
import { ArrowRight, FileCode2, Folder } from "lucide-react"
import { GROUP_ICONS } from "@/components/site/icons"
import { MewoMark } from "@/components/site/mewo-mark"
import { getDependencies, getGroups, getItem, getItems } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { Marquee } from "@/registry/mewo/ui/marquee"

function Card({
  title,
  description,
  href,
  cta,
  className,
  children,
}: {
  title: string
  description: string
  /** Where the card's link goes, with `cta` as its text. */
  href?: string
  cta?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card/50 p-1.5", className)}>
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border bg-background/60">
        {children}
      </div>
      <div className="flex flex-1 flex-col space-y-1.5 p-4">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        {href && cta ? (
          <Link
            href={href}
            className="group mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-brand-text transition-colors hover:text-foreground"
          >
            {cta}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

const chipClass = "rounded-lg border bg-card px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground"

function CatalogVisual() {
  const titles = getItems().map((item) => item.title)
  const half = Math.ceil(titles.length / 2)
  const fade = "mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
  return (
    <div className="w-full space-y-3">
      <Marquee speed={40} className={fade}>
        {titles.slice(0, half).map((title) => (
          <span key={title} className={chipClass}>
            {title}
          </span>
        ))}
      </Marquee>
      <Marquee speed={40} direction="right" className={fade}>
        {titles.slice(half).map((title) => (
          <span key={title} className={chipClass}>
            {title}
          </span>
        ))}
      </Marquee>
    </div>
  )
}

function DependenciesVisual() {
  // one that needs nothing, one on Motion, one on a WebGL library, one on Base UI
  const rows = ["text-shimmer", "split-text", "dream-cat", "glass-panel"].flatMap((name) => {
    const item = getItem(name)
    return item ? [{ title: item.title, deps: getDependencies(item) }] : []
  })
  return (
    <ul className="w-full space-y-1.5 px-4">
      {rows.map((row) => (
        <li key={row.title} className="flex items-center justify-between gap-3 rounded-lg border bg-card/80 px-3 py-1.5 text-xs">
          <span className="font-medium">{row.title}</span>
          <span className="truncate font-mono text-muted-foreground">{row.deps.length > 0 ? row.deps.join(" · ") : "nothing"}</span>
        </li>
      ))}
    </ul>
  )
}

function CategoriesVisual() {
  // the groups that hold items, as the sidebar lists them
  const groups = getGroups().map((entry) => entry.group)
  return (
    <div className="relative size-40">
      <div aria-hidden className="absolute inset-3 rounded-full border border-dashed" />
      <div className="absolute inset-0 motion-safe:animate-[mewo-orbit_40s_linear_infinite]">
        {groups.map((group, index) => {
          const Icon = GROUP_ICONS[group]
          const angle = (index / groups.length) * Math.PI * 2 - Math.PI / 2
          return (
            <span
              key={group}
              className="absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card"
              style={{ left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` }}
            >
              <Icon className="size-4 text-muted-foreground motion-safe:animate-[mewo-orbit_40s_linear_infinite_reverse]" aria-hidden />
            </span>
          )
        })}
      </div>
      <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border bg-card shadow-lg">
        <MewoMark className="h-6 w-auto" />
      </span>
    </div>
  )
}

function ReducedMotionVisual() {
  const track = "@container relative h-9 w-full overflow-hidden rounded-lg border bg-card/80"
  const block = "absolute top-1.5 left-1.5 size-6 rounded-md bg-brand"
  return (
    <div className="w-full space-y-2.5 px-5 font-mono text-[11px] text-muted-foreground">
      <p>prefers-reduced-motion: no-preference</p>
      <div className={track}>
        {/* 100cqw is the track's width: the block travels to the far end, less its own size and inset. */}
        <span className={cn(block, "[--slide-to:calc(100cqw-2.25rem)] motion-safe:animate-[mewo-slide_3s_ease-in-out_infinite]")} />
      </div>
      <p>prefers-reduced-motion: reduce</p>
      <div className={track}>
        <span className={block} />
      </div>
    </div>
  )
}

function FilesVisual() {
  const files = ["split-text.tsx", "spotlight-card.tsx", "text-shimmer.tsx"]
  return (
    <div className="w-full px-6 font-mono text-xs">
      <p className="flex items-center gap-2 text-muted-foreground">
        <Folder className="size-3.5" aria-hidden /> components/ui
      </p>
      <ul className="mt-1.5 ml-1.5 space-y-1 border-l pl-3.5">
        {files.map((file, index) => (
          <li
            key={file}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1",
              index === 0 ? "bg-brand/15 text-brand-text" : "text-muted-foreground"
            )}
          >
            <FileCode2 className="size-3.5" aria-hidden /> {file}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The Background Studio in miniature: a tuned background on the stage, its controls beside it, the exports under it. */
function StudioVisual() {
  const rows = [
    { label: "Flow", value: "0.8", at: "62%" },
    { label: "Speed", value: "1", at: "40%" },
    { label: "Grain", value: "8%", at: "24%" },
    { label: "Silk", value: "0.35", at: "35%" },
  ]
  return (
    <div className="grid w-full grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2 px-4">
      <div className="relative h-36 overflow-hidden rounded-lg border bg-[linear-gradient(135deg,#120f17_0%,#2a0f0a_28%,#9a3412_58%,#f97316_82%,#fed7aa_100%)]">
        <div aria-hidden className="absolute inset-0 bg-dots opacity-20 mix-blend-overlay" />
        <div className="absolute inset-x-2 bottom-2 flex gap-1">
          {["Code", "PNG", "Video"].map((kind) => (
            <span key={kind} className="rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {kind}
            </span>
          ))}
        </div>
      </div>
      <ul className="space-y-1.5 self-center">
        {rows.map((row) => (
          <li key={row.label} className="relative h-7.5 overflow-hidden rounded-md bg-foreground/5 text-[11px] font-medium">
            <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-brand/20" style={{ width: row.at }} />
            <span className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground">{row.label}</span>
            <span className="absolute top-1/2 right-2 -translate-y-1/2 text-foreground tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WhatsInside() {
  const count = getItems().length
  return (
    <section aria-labelledby="inside-heading" className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-brand-text">The library</p>
        <h2 id="inside-heading" className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          What&apos;s inside
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          A shadcn registry of components and page sections, the whole sites they build, and the tools to tune
          them. Everything installs with one command and lands in your project as source.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <Card
          className="lg:col-span-5"
          title={`${count} components and sections`}
          description="Text effects, carousels, scroll scenes, cards, backgrounds and full page sections — the parts you would otherwise build from scratch."
          href="/docs/components"
          cta="Browse the catalog"
        >
          <CatalogVisual />
        </Card>
        <Card
          className="lg:col-span-3"
          title="Only what it needs"
          description="Each item installs just the packages it uses: Motion, a WebGL library, or nothing at all."
        >
          <DependenciesVisual />
        </Card>
        <Card
          className="lg:col-span-4"
          title="Well organized"
          description={`${getGroups().length} clear categories, from text effects to whole page sections.`}
        >
          <CategoriesVisual />
        </Card>
        <Card
          className="lg:col-span-4"
          title="Reduced motion, built in"
          description="Every item checks prefers-reduced-motion and settles into a still, readable state."
        >
          <ReducedMotionVisual />
        </Card>
        <Card
          className="lg:col-span-4"
          title="Yours to edit"
          description="The CLI copies the source into your project. No wrapper library to lock you in."
        >
          <FilesVisual />
        </Card>
        <Card
          className="lg:col-span-4"
          title="Background Studio"
          description="Tune any background live, drop sample content over it, then export the code, a PNG or a video. The link reproduces the exact look."
          href="/studio"
          cta="Open the studio"
        >
          <StudioVisual />
        </Card>
      </div>
    </section>
  )
}
