import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CodeBlock } from "@/components/site/code-block"
import { GitHubIcon } from "@/components/site/icons"
import { PixelField } from "@/components/site/home/pixel-field"
import { TerminalDemo, type TerminalRun } from "@/components/site/home/terminal-demo"
import { Window } from "@/components/site/home/window"
import { getDependencies, getItem, getItems } from "@/lib/registry"
import { GITHUB_URL } from "@/lib/site"
import { SplitText } from "@/registry/mewo/ui/split-text"
import { SpotlightCard } from "@/registry/mewo/ui/spotlight-card"

const SPOTLIGHT = "rgb(24 33 251 / 0.45)"

// What the preview window renders, as it would appear in the reader's project.
const SNIPPET = `import { SplitText } from "@/components/ui/split-text"
import { SpotlightCard } from "@/components/ui/spotlight-card"

export function Hero() {
  return (
    <SpotlightCard spotlightColor="${SPOTLIGHT}">
      <SplitText as="h2" by="words" stagger={0.08}>
        Make the web move
      </SplitText>
      <p>Hover the card — the light follows you.</p>
    </SpotlightCard>
  )
}`

const TERMINAL_ITEMS = ["split-text", "spotlight-card", "text-shimmer", "marquee"]

export function Hero() {
  const count = getItems().length
  const runs: TerminalRun[] = TERMINAL_ITEMS.flatMap((name) => {
    const item = getItem(name)
    return item ? [{ name, dependencies: getDependencies(item) }] : []
  })

  return (
    <section className="relative">
      <PixelField className="pointer-events-none absolute top-0 right-0 h-105 w-[58%] max-lg:hidden" />
      <div className="relative mx-auto max-w-360 px-4 pt-14 sm:px-6 sm:pt-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/docs/concave-carousel"
              className="group inline-flex items-center gap-2 rounded-full border bg-card/70 p-1 pr-3 text-xs backdrop-blur transition-colors hover:bg-card"
            >
              <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-brand-foreground">New</span>
              <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                Concave, Parallax and Prism carousels
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <h1 className="mt-6 text-5xl leading-[1.04] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4rem]">
              Animated React components
              <br className="max-sm:hidden" /> <span className="text-brand-text">you own.</span>
            </h1>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/docs/components"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-medium text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_30px_-8px_var(--brand)] transition-[filter] hover:brightness-110"
              >
                Browse components
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl border bg-card/70 px-5 font-medium backdrop-blur transition-colors hover:bg-card"
              >
                <GitHubIcon className="size-4" />
                Star on GitHub
              </a>
            </div>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground lg:pb-2">
            {count} animated components and sections for shadcn. One command installs the source — with Motion or GSAP
            only where an item needs it.
          </p>
        </div>

        <div className="relative mt-14 overflow-hidden rounded-3xl border bg-card/30">
          <div aria-hidden className="absolute inset-0 bg-dots opacity-70" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(70%_70%_at_75%_110%,color-mix(in_oklch,var(--brand)_55%,transparent),transparent_70%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(40%_50%_at_0%_0%,color-mix(in_oklch,var(--brand)_18%,transparent),transparent_70%)]"
          />
          <div className="relative grid grid-cols-1 gap-5 p-3 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:p-12">
            <Window title="Hero.tsx" className="lg:row-span-2">
              <CodeBlock code={SNIPPET} className="code-lines max-h-none rounded-none border-0 bg-transparent" />
            </Window>
            <Window title="Terminal" bodyClassName="min-h-[164px]">
              <TerminalDemo runs={runs} />
            </Window>
            <Window title="Preview" bodyClassName="flex min-h-[240px] items-center justify-center bg-background/50 bg-dots p-6">
              <SpotlightCard spotlightColor={SPOTLIGHT} className="w-full max-w-sm">
                <SplitText as="h2" by="words" stagger={0.08} className="text-3xl font-semibold tracking-tight">
                  Make the web move
                </SplitText>
                <p className="mt-2 text-sm text-muted-foreground">Hover the card — the light follows you.</p>
              </SpotlightCard>
            </Window>
          </div>
        </div>
      </div>
    </section>
  )
}
