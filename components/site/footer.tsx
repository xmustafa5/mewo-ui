import Link from "next/link"
import { GitHubIcon } from "@/components/site/icons"
import { MewoMark, PixelSteps } from "@/components/site/mewo-mark"
import { GITHUB_URL, SITE_NAME } from "@/lib/site"

const columns = [
  {
    title: "Docs",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "All components", href: "/docs/components" },
      { label: "Sections", href: "/docs/hero-aurora" },
      { label: "Background Studio", href: "/studio" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source on GitHub", href: GITHUB_URL },
      { label: "Report an issue", href: `${GITHUB_URL}/issues` },
      { label: "shadcn registry directory", href: "https://ui.shadcn.com/docs/registry/directory" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto grid max-w-360 gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto_auto] md:gap-20">
        <div className="max-w-xs space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <MewoMark className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Animated React components and sections for shadcn. Install one, and the code is yours.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitHubIcon className="size-4" />
            xmustafa5/mewo-ui
          </a>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-medium">{column.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <p>MIT License · Free and open source</p>
          <PixelSteps className="size-4" />
        </div>
      </div>
    </footer>
  )
}
