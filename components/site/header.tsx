import Link from "next/link"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { GITHUB_URL, SITE_NAME } from "@/lib/site"

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground">
            Docs
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
