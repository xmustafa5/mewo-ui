import { CustomizeSection } from "@/components/site/home/customize-section"
import { Gallery } from "@/components/site/home/gallery"
import { Hero } from "@/components/site/home/hero"
import { InstallSection } from "@/components/site/home/install-section"
import { Latest } from "@/components/site/home/latest"
import { SitesSection } from "@/components/site/home/sites-section"
import { StudioSection } from "@/components/site/home/studio-section"
import { WhatsInside } from "@/components/site/home/whats-inside"

/**
 * The home page: the hero, the latest release, live demos, the Customize panel at work, the sites built with the
 * pieces, the Background Studio at work, the install, and last what the library holds. The closing call to action
 * lives in the footer card, which shows it on this page only.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Latest />
      <Gallery />
      <CustomizeSection />
      <SitesSection />
      <StudioSection />
      <InstallSection />
      <WhatsInside />
    </>
  )
}
