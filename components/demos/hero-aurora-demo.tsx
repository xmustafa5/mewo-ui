import { HeroAurora } from "@/registry/mewo/blocks/hero-aurora"
import type { PropDoc } from "./types"

export default function HeroAuroraDemo() {
  return <HeroAurora />
}

export const props: PropDoc[] = [
  { name: "eyebrow", type: "string", default: '"Now in v0.1"', description: "Small pill above the headline." },
  { name: "title", type: "string", default: '"Animated components for React"', description: "Headline, animated word by word." },
  { name: "description", type: "string", description: "Paragraph under the headline." },
  { name: "primaryCta", type: "{ label: string; href: string }", description: "Filled button." },
  { name: "secondaryCta", type: "{ label: string; href: string }", description: "Outline button." },
  { name: "className", type: "string", description: "Merged onto the root section." },
]
