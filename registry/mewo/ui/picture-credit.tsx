"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PictureCreditProps extends Omit<React.ComponentProps<"p">, "title"> {
  /** The picture's name, underlined (linked when href is set). */
  title?: string
  /** Place and date, after the name. */
  by?: string
  /** The small grey line: where it is kept, the photograph's credit and licence. */
  line?: string
  /** Where the name links (it opens in a new tab). */
  href?: string
}

/** A picture's credit, centred: its name underlined and linked, then place and date, over a small grey line. */
export function PictureCredit({
  title = "An old vessel",
  by = "c. 3000 BCE",
  line = "A museum somewhere. Placeholder photograph.",
  href,
  className,
  ...props
}: PictureCreditProps) {
  return (
    <p data-slot="picture-credit" className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", "grid gap-[calc(var(--story-u)*0.5)] text-center", className)} {...props}>
      <span className="text-[length:max(12px,calc(var(--story-u)*1.2))] leading-[1.2] max-[900px]:text-[length:calc(var(--story-u)*1)]">
        <a href={href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto">
          <em className="not-italic underline underline-offset-[0.15em]">{title}</em>
        </a>
        , {by}
      </span>
      <span className="text-[10px] leading-[1.25] text-muted-foreground">{line}</span>
    </p>
  )
}
