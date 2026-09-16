import Link from "next/link"
import { getItems, isBlock } from "@/lib/registry"
import { GITHUB_URL } from "@/lib/site"
import { FeaturesSpotlight } from "@/registry/mewo/blocks/features-spotlight"
import { HeroAurora } from "@/registry/mewo/blocks/hero-aurora"

export default function HomePage() {
  const items = getItems()

  return (
    <>
      <HeroAurora
        eyebrow="Open-source shadcn registry"
        title="Animated components you own"
        description="Six motion components and two sections, installed with one command. The code lands in your project — edit it however you like."
        primaryCta={{ label: "Read the docs", href: "/docs" }}
        secondaryCta={{ label: "GitHub", href: GITHUB_URL }}
      />
      <FeaturesSpotlight eyebrow="Why mewo" title="Motion that installs cleanly" />
      <section className="mx-auto w-full max-w-5xl px-6 py-24">
        <h2 className="text-2xl font-bold tracking-tight">Everything in v0.1</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.name}>
              <Link href={`/docs/${item.name}`} className="block h-full rounded-xl border p-5 transition-colors hover:bg-muted/50">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{isBlock(item) ? "Section" : "Component"}</p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
