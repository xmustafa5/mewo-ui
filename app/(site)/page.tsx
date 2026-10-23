import { Gallery } from "@/components/site/home/gallery"
import { Hero } from "@/components/site/home/hero"
import { InstallSection } from "@/components/site/home/install-section"
import { WhatsInside } from "@/components/site/home/whats-inside"

/** The closing call to action lives in the footer card, which shows it on this page only. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <WhatsInside />
      <Gallery />
      <InstallSection />
    </>
  )
}
