"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { ByTheme } from "@/components/demos/by-theme"
import { GitHubIcon } from "@/components/site/icons"
import { GITHUB_URL } from "@/lib/site"
import { DotGrid } from "@/registry/mewo/ui/dot-grid"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** Becomes true the first time the element comes within `margin` of the viewport, and stays true. */
function useNearOnce(margin: string) {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const [near, setNear] = React.useState(false)

  React.useEffect(() => {
    if (!node || near) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin: margin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, near, margin])

  return [setNode, near] as const
}

/**
 * The home page's closing call to action, the first thing inside the footer card. The Dot Grid behind it
 * is a WebGL 2 canvas, so it is only created once the footer is close to the viewport, and never for a
 * visitor who asked for reduced motion. Until then, and for them, a CSS lattice in the same spacing
 * stands in. Every other page's footer starts straight at the links.
 */
export function FooterLead({ count }: { count: number }) {
  const pathname = usePathname()
  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  )
  const [ref, near] = useNearOnce("400px")

  if (pathname !== "/") return null
  const live = near && !reducedMotion

  return (
    <div
      ref={ref}
      className="relative isolate mx-1.5 mt-1.5 flex flex-col items-center overflow-hidden rounded-[18px] bg-card px-6 pt-[clamp(5rem,7.5vw,6.5rem)] pb-[clamp(7.5rem,11vw,9.75rem)] text-center after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_6%,transparent)] max-[700px]:rounded-[14px] max-[600px]:px-5 max-[600px]:pt-14 max-[600px]:pb-24 dark:bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mask-[linear-gradient(to_bottom,transparent_8%,black_72%)]"
      >
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(55%_85%_at_50%_100%,color-mix(in_oklch,var(--brand)_30%,transparent),transparent_72%)] dark:bg-[radial-gradient(55%_85%_at_50%_100%,color-mix(in_oklch,var(--brand)_42%,transparent),transparent_72%)]" />
        {live ? (
          <ByTheme
            dark={<DotGrid className="absolute inset-0" baseColor="#30354f" activeColor="#c3c9ff" glow={0.6} />}
            light={<DotGrid className="absolute inset-0" baseColor="#cfd2e3" activeColor="#2f35d9" glow={0.25} />}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle,var(--lattice)_2.5px,transparent_3px)] bg-[length:23px_23px] bg-center [--lattice:#cfd2e3] dark:[--lattice:#30354f]" />
        )}
      </div>

      <h2 className="relative text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.045em] text-balance">
        Make your interface move.
      </h2>
      <p className="relative mt-3 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
        {count} components and sections today, with more on the way. Free, open source and MIT licensed.
      </p>
      <div className="relative mt-8 flex gap-2.5 max-[600px]:w-full max-[600px]:flex-col">
        <Link
          href="/docs/components"
          className="group inline-flex items-center justify-center gap-2 rounded-[10px] bg-foreground py-[11px] pr-[19px] pl-[22px] text-[13px] font-medium text-background shadow-[0_5px_18px_rgb(24_24_27/0.14)] transition-[filter,transform] hover:-translate-y-px hover:brightness-90 active:scale-[0.97] motion-reduce:transform-none dark:shadow-none"
        >
          Browse components
          <ArrowRight className="size-[15px] transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border bg-card px-[22px] py-[11px] text-[13px] font-medium shadow-[0_1px_2px_rgb(24_24_27/0.08)] backdrop-blur-md transition-[background-color,transform] hover:-translate-y-px hover:bg-accent active:scale-[0.97] motion-reduce:transform-none dark:border-transparent dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07)] dark:hover:bg-white/12"
        >
          <GitHubIcon className="size-4" />
          Star on GitHub
        </a>
      </div>
    </div>
  )
}
