import Link from "next/link"
import { AppWindowMac, ArrowRight, Download, Link2, SlidersHorizontal } from "lucide-react"
import { StudioDemo } from "@/components/site/home/studio-demo"

const POINTS = [
  { Icon: SlidersHorizontal, text: "Presets to start from, then a control for every prop, with undo for every change." },
  { Icon: AppWindowMac, text: "Sample content over the stage, a landing page, a phone or a card, to judge the background with real text on it." },
  { Icon: Download, text: "Export the code, a PNG at any size or a looping video, rendered frame by frame so the file is exact on any machine." },
  { Icon: Link2, text: "The address is the document: copy the link, and the exact look comes back." },
]

/** The Background Studio, explained over a working miniature of it. */
export function StudioSection() {
  return (
    <section aria-labelledby="studio-heading" className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-text">Background Studio</p>
          <h2 id="studio-heading" className="mt-2 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-5xl">
            Tune a background live, then take it with you.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The Studio puts any of the library&apos;s backgrounds on a stage. Pick a preset, move the controls and
            watch it answer; lay a page over it to see it at work. Try it below, then open the real thing with the
            same settings.
          </p>
          <Link
            href="/studio"
            className="group mt-6 inline-flex h-11 items-center gap-2 rounded-xl border bg-card/70 px-5 font-medium transition-colors hover:bg-card"
          >
            Open the Studio
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {POINTS.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border bg-card">
                <Icon className="size-3.5 text-brand-text" aria-hidden />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12">
        <StudioDemo />
      </div>
    </section>
  )
}
