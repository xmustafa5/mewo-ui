import { Header } from "@/components/site/header"

/** The studio fills the viewport under the header; there is no footer to scroll to. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </>
  )
}
