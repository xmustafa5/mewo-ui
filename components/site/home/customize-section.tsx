import Link from "next/link"
import { ArrowRight, Link2, Monitor, Palette, SlidersHorizontal } from "lucide-react"
import { CustomizeDemo } from "@/components/site/home/customize-demo"

const POINTS = [
  { Icon: SlidersHorizontal, text: "Sliders, selects, switches, text fields and a full colour picker, one row per prop." },
  { Icon: Link2, text: "The values live in the address, so a customised look is a link you can send." },
  { Icon: Monitor, text: "Preview at desktop, tablet and phone widths, or drag the handle to any width." },
  { Icon: Palette, text: "The Code tab writes the usage with your values; backgrounds open in the Studio with them." },
]

/** The Customize panel every component page carries, explained beside a working one. */
export function CustomizeSection() {
  return (
    <section aria-labelledby="customize-heading" className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-medium text-brand-text">On every component page</p>
          <h2 id="customize-heading" className="mt-2 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-5xl">
            Customize every piece before you install it.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Under each preview sits a Customize panel with a control for every prop that changes how the piece looks
            or moves. Drag a slider and the preview answers at once; the usage snippet follows, ready to paste.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border bg-card">
                  <Icon className="size-3.5 text-brand-text" aria-hidden />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/docs/text-shimmer"
            className="group mt-8 inline-flex h-11 items-center gap-2 rounded-xl border bg-card/70 px-5 font-medium transition-colors hover:bg-card"
          >
            Try it on Text Shimmer
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <CustomizeDemo />
      </div>
    </section>
  )
}
