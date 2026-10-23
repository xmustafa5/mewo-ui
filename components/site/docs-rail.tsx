"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { OnThisPage, StarCard } from "@/components/site/docs-ui"

/** The sections every component page has, in order. */
const ITEM_SECTIONS = [
  { id: "install", label: "Install" },
  { id: "props", label: "Props" },
  { id: "source", label: "Source" },
]

/** The rail's lead card, in the place React Bits gives its Pro card: the one tool mewo ships. */
function StudioCard() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card/50 p-1.5">
      <Link href="/studio" className="relative block aspect-video overflow-hidden rounded-xl ring-1 ring-border/60">
        <Image
          src="/previews/grainient-light.webp"
          alt=""
          width={640}
          height={360}
          unoptimized
          className="size-full object-cover dark:hidden"
        />
        <Image
          src="/previews/grainient-dark.webp"
          alt=""
          width={640}
          height={360}
          unoptimized
          className="hidden size-full object-cover dark:block"
        />
        <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur">
          Background Studio
        </span>
      </Link>
      <div className="space-y-3 p-3">
        <p className="font-semibold tracking-tight">Tune a background, take the code.</p>
        <p className="text-sm text-muted-foreground">
          Change every prop live, try it under sample content, then export the code, an image or a video.
        </p>
        <Link
          href="/studio"
          className="group flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-sm font-medium text-brand-foreground transition-[filter] hover:brightness-110"
        >
          Open the studio
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/** The docs' right rail: the section links on a component page, the studio, and the repo. */
export function DocsRail({ itemNames }: { itemNames: string[] }) {
  const pathname = usePathname()
  const isItem = itemNames.some((name) => pathname === `/docs/${name}`)

  return (
    <div className="space-y-4">
      {isItem ? <OnThisPage links={ITEM_SECTIONS} /> : null}
      <StudioCard />
      <StarCard />
    </div>
  )
}
