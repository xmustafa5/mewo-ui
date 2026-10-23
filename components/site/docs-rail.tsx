"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { OnThisPage, RAIL_CARD, StarCard } from "@/components/site/docs-ui"

/** The sections every component page has, in order. */
const ITEM_SECTIONS = [
  { id: "install", label: "Install" },
  { id: "props", label: "Props" },
  { id: "source", label: "Source" },
]

/** The rail's lead card, in the place and shape of React Bits' Pro card: the one tool mewo ships. */
function StudioCard() {
  return (
    <Link href="/studio" className={`group block ${RAIL_CARD} hover:border-brand/30`}>
      <div className="relative m-1.5 h-40 overflow-hidden rounded-[10px] bg-background ring-1 ring-border/60">
        <Image
          src="/previews/grainient-light.webp"
          alt=""
          width={640}
          height={360}
          unoptimized
          className="size-full scale-[1.01] object-cover transition-transform duration-600 ease-out group-hover:scale-[1.045] dark:hidden"
        />
        <Image
          src="/previews/grainient-dark.webp"
          alt=""
          width={640}
          height={360}
          unoptimized
          className="hidden size-full scale-[1.01] object-cover opacity-90 transition-transform duration-600 ease-out group-hover:scale-[1.045] dark:block"
        />
        <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur">
          Background Studio
        </span>
      </div>
      <div className="flex flex-col items-start px-5 pt-[15px] pb-[22px]">
        <h3 className="text-[17px] leading-[1.22] font-semibold tracking-[-0.025em] text-balance">
          Tune a background, take the code.
        </h3>
        <p className="mt-2 text-[11.5px] leading-[1.55] text-muted-foreground text-balance">
          Change every prop live and try it under sample content, then export the code, an image or a video.
        </p>
        <div className="mt-3.5 flex flex-col gap-[3px] text-[10px] leading-[1.4] font-medium text-muted-foreground/80">
          <span>3 backgrounds · Every prop live</span>
          <span>Export code · PNG · WebM</span>
        </div>
        <span className="mt-[18px] -mb-1 flex h-10 items-center justify-center gap-1.5 self-stretch rounded-[10px] bg-brand text-[13px] font-semibold text-brand-foreground transition-[filter] group-hover:brightness-110">
          Open the studio
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

/**
 * The docs' right rail: the section links on a component page, the studio, and the repo. Beside the page it
 * is one column; when the window is too narrow for that it sits under the page, two cards side by side.
 */
export function DocsRail({ itemNames }: { itemNames: string[] }) {
  const pathname = usePathname()
  const isItem = itemNames.some((name) => pathname === `/docs/${name}`)

  return (
    <div className="grid grid-cols-2 items-start gap-4 rail:grid-cols-1">
      {isItem ? <OnThisPage links={ITEM_SECTIONS} className="max-rail:hidden" /> : null}
      <StudioCard />
      <StarCard />
    </div>
  )
}
