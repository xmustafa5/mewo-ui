import Link from "next/link"
import { WordmarkArt } from "@/components/site/footer/wordmark-art"
import { FooterLead } from "@/components/site/home/footer-lead"
import { MewoMark } from "@/components/site/mewo-mark"
import { getGroups, getItems } from "@/lib/registry"
import { GITHUB_URL, SITE_NAME } from "@/lib/site"

const AUTHOR = { handle: "@xmustafa5", url: "https://github.com/xmustafa5" }

const linkClass =
  "rounded-[3px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return href.startsWith("/") ? (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

/**
 * The site footer, in the shape of React Bits': one rounded card holding the home page's closing call to
 * action (home only), the brand, three columns of links and the legal line, and at the bottom the word
 * "mewo" cut out of a field of pixels.
 */
export function Footer() {
  const backgrounds = getGroups().find((group) => group.group === "background")?.items ?? []
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
      title: "Backgrounds",
      links: backgrounds.slice(0, 4).map((item) => ({ label: item.title, href: `/docs/${item.name}` })),
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

  return (
    <footer className="w-full overflow-clip pt-[clamp(1.5rem,3vw,2.5rem)] pb-6">
      <div className="mx-auto max-w-331 px-6 max-sm:px-4">
        <div className="relative isolate overflow-hidden rounded-3xl bg-secondary/70 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_5%,transparent)] max-[700px]:rounded-[20px] dark:bg-card dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05),inset_0_0_0_1px_rgb(255_255_255/0.035)]">
          <FooterLead count={getItems().length} />

          <div
            data-footer-top
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-12 gap-y-8 px-10 pt-10 max-[700px]:grid-cols-1 max-[700px]:px-[22px] max-[700px]:pt-7"
          >
            <div className="col-start-1 row-start-1 max-[700px]:col-auto max-[700px]:row-auto">
              <Link
                href="/"
                aria-label={`${SITE_NAME} home`}
                className="flex w-fit items-center gap-2.5 rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <MewoMark eyes="var(--background)" className="h-8 w-auto text-foreground" />
                <span className="text-[28px] leading-none font-semibold tracking-[-0.04em]">{SITE_NAME}</span>
              </Link>
              <p className="mt-3.5 text-[13px] leading-[1.55] text-muted-foreground">
                Animated React components for shadcn.
                <br />
                Install one, and the code is yours.
              </p>
            </div>

            <nav
              aria-label="Footer"
              className="col-start-2 row-span-2 row-start-1 grid grid-cols-[repeat(3,max-content)] gap-x-[clamp(2.5rem,5vw,5rem)] text-[13px] max-[700px]:col-auto max-[700px]:row-auto max-[700px]:grid-cols-3 max-[700px]:gap-x-4 max-[600px]:text-xs"
            >
              {columns.map((column) => (
                <div key={column.title} className="flex flex-col items-start gap-3 leading-normal">
                  <p className="flex min-h-[34px] items-center text-xs font-medium text-foreground">{column.title}</p>
                  {column.links.map((link) => (
                    <FooterLink key={link.href} href={link.href}>
                      {link.label}
                    </FooterLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-y-1.5 self-end text-xs text-muted-foreground max-[700px]:col-auto max-[700px]:row-auto max-[600px]:flex-col max-[600px]:items-start max-[600px]:text-[11px] [&>*+*]:before:mx-2.5 [&>*+*]:before:inline-block [&>*+*]:before:opacity-70 [&>*+*]:before:content-['·'] max-[600px]:[&>*+*]:before:content-none">
              <span>
                © {new Date().getFullYear()} {SITE_NAME}
              </span>
              <span>
                <FooterLink href={`${GITHUB_URL}/blob/main/LICENSE`}>MIT License</FooterLink>
              </span>
              <span>
                Built by <FooterLink href={AUTHOR.url}>{AUTHOR.handle}</FooterLink>
              </span>
            </div>
          </div>

          <WordmarkArt />
        </div>
      </div>
    </footer>
  )
}
