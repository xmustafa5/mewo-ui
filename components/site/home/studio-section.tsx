import Link from "next/link"
import { AppWindowMac, ArrowRight, Download, Link2, SlidersHorizontal } from "lucide-react"
import { StudioExample, type StudioExampleProps } from "@/components/site/home/studio-example"
import { DEFAULT_BACKGROUND, defaultProps, findEntry, presetProps } from "@/components/studio/catalog"
import { writeDocument } from "@/components/studio/params"
import { hasPreview } from "@/lib/catalog"

const POINTS = [
  { Icon: SlidersHorizontal, text: "Presets to start from, then a control for every prop, with undo for every change." },
  { Icon: AppWindowMac, text: "Sample content over the stage, a landing page, a phone or a card, to judge the background with real text on it." },
  { Icon: Download, text: "Export the code, a PNG at any size or a looping video, rendered frame by frame so the file is exact on any machine." },
  { Icon: Link2, text: "The address is the document: copy the link, and the exact look comes back." },
]

/** The example on the stage: the studio's default background on this preset, and three of its controls. */
const PRESET = "silk"
const SHOWN = ["spacing", "depth", "speed"]

const example = (): StudioExampleProps => {
  const entry = findEntry(DEFAULT_BACKGROUND)
  if (!entry) throw new Error(`The studio has no "${DEFAULT_BACKGROUND}"`)
  const preset = entry.presets?.find((item) => item.value === PRESET) ?? entry.presets?.[0] ?? null
  const values = { ...defaultProps(entry), ...presetProps(entry, preset?.value ?? null) }
  const sliders = SHOWN.flatMap((name) => {
    const definition = entry.props.find((prop) => prop.name === name && prop.type === "number")
    if (!definition || definition.min === undefined || definition.max === undefined) return []
    const value = Number(values[name])
    return [{ label: definition.label, value: String(value), at: `${Math.round(((value - definition.min) / (definition.max - definition.min)) * 100)}%` }]
  })
  return {
    name: entry.id,
    title: entry.label,
    description: entry.description,
    presets: (entry.presets ?? []).map((item) => item.label),
    chosen: preset?.label ?? "",
    sliders,
    href: `/studio?${writeDocument({ id: entry.id, preset: preset?.value ?? null, changes: {} }, entry).toString()}`,
    hasPreview: hasPreview(entry.id),
  }
}

/** The Background Studio, explained, with one background on its stage as a picture that opens it. */
export function StudioSection() {
  const shown = example()
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
            watch it answer; lay a page over it to see it at work. Here it is with {shown.title} on the stage: open
            the Studio to tune this one, or any other.
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
        <StudioExample {...shown} />
      </div>
    </section>
  )
}
