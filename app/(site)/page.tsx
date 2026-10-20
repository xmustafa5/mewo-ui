import { ClosingCta } from "@/components/site/home/closing-cta"
import { Gallery } from "@/components/site/home/gallery"
import { Hero } from "@/components/site/home/hero"
import { InstallSection } from "@/components/site/home/install-section"
import { WhatsInside } from "@/components/site/home/whats-inside"

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhatsInside />
      <Gallery />
      <InstallSection />
      <ClosingCta />
    </>
  )
}
