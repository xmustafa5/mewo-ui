import { Header } from "@/components/site/header"

/** A site's viewer fills the viewport under the header, like the studio: the framed site is the only thing that scrolls. */
export default function SiteViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </>
  )
}
