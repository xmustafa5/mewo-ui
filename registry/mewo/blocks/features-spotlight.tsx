"use client"

import * as React from "react"
import { Feather, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Marquee } from "@/registry/mewo/ui/marquee"
import { ScrollReveal } from "@/registry/mewo/ui/scroll-reveal"
import { SpotlightCard } from "@/registry/mewo/ui/spotlight-card"
import { TextShimmer } from "@/registry/mewo/ui/text-shimmer"

export interface Feature {
  icon?: React.ReactNode
  title: string
  description: string
}

export interface FeaturesSpotlightProps extends React.ComponentProps<"section"> {
  eyebrow?: string
  title?: string
  features?: Feature[]
  logos?: React.ReactNode[]
}

const DEFAULT_FEATURES: Feature[] = [
  { icon: <Zap className="size-5" />, title: "Fast by default", description: "GPU-friendly transforms and opacity only. Nothing that triggers layout." },
  { icon: <Feather className="size-5" />, title: "Light footprint", description: "Each component pulls in only the library it needs — some need none." },
  { icon: <Sparkles className="size-5" />, title: "Motion built in", description: "Enter, hover and scroll animations that respect reduced-motion settings." },
]

const DEFAULT_LOGOS = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"].map((name) => (
  <span key={name} className="text-xl font-semibold text-muted-foreground/60">
    {name}
  </span>
))

export function FeaturesSpotlight({
  eyebrow = "Why mewo",
  title = "Everything you need to ship motion",
  features = DEFAULT_FEATURES,
  logos = DEFAULT_LOGOS,
  className,
  ...props
}: FeaturesSpotlightProps) {
  return (
    <section data-slot="features-spotlight" className={cn("px-6 py-24", className)} {...props}>
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center">
          <TextShimmer className="text-sm font-medium uppercase tracking-wider">{eyebrow}</TextShimmer>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15} className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <SpotlightCard key={feature.title}>
              {feature.icon ? (
                <div className="mb-4 inline-flex size-9 items-center justify-center rounded-lg border bg-muted">{feature.icon}</div>
              ) : null}
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </SpotlightCard>
          ))}
        </ScrollReveal>
        <Marquee speed={40} className="mt-16 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          {logos}
        </Marquee>
      </div>
    </section>
  )
}
