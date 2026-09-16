"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export interface SplitTextProps extends Omit<React.ComponentProps<"span">, "children"> {
  children: string
  by?: "chars" | "words"
  /** Seconds between each unit. */
  stagger?: number
  /** Seconds before the first unit. */
  delay?: number
  /** Play once, or replay every time it scrolls into view. */
  once?: boolean
  as?: "span" | "h1" | "h2" | "h3" | "p"
}

// Intl.Segmenter's declarations live in lib.es2022.intl, and this file is compiled by whatever
// `lib` the project it is installed into uses. Declaring the shape here keeps it compiling under
// ES2017 and up; the runtime check is what decides whether the API is really there.
type GraphemeSegmenter = { segment(input: string): Iterable<{ segment: string }> }
type GraphemeSegmenterConstructor = new (
  locales: undefined,
  options: { granularity: "grapheme" }
) => GraphemeSegmenter

export function splitUnits(text: string, by: "chars" | "words"): string[] {
  if (by === "words") return text.split(/(\s+)/).filter((unit) => unit.length > 0)
  // Code points tear emoji, flags and combining marks apart — a unit must be a whole grapheme cluster.
  const Segmenter =
    typeof Intl === "undefined"
      ? undefined
      : (Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }).Segmenter
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: "grapheme" })
    return Array.from(segmenter.segment(text), (segment) => segment.segment)
  }
  return Array.from(text)
}

export function SplitText({
  children,
  by = "chars",
  stagger = 0.03,
  delay = 0,
  once = true,
  as: Tag = "span",
  className,
  ...props
}: SplitTextProps) {
  const ref = React.useRef<HTMLElement>(null)
  const units = React.useMemo(() => splitUnits(children, by), [children, by])

  useGSAP(
    () => {
      const root = ref.current
      if (!root) return
      const targets = root.querySelectorAll<HTMLElement>("[data-split-unit]")
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(targets, {
          yPercent: 110,
          opacity: 0,
          stagger,
          delay,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 85%",
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        })
      })
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(targets, { yPercent: 0, opacity: 1 })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [units, stagger, delay, once] }
  )

  return React.createElement(
    Tag,
    {
      ref,
      "data-slot": "split-text",
      // Every unit is aria-hidden, so the text reaches assistive tech once as the root's accessible
      // name — and stays in the DOM once, so textContent, innerText and a copy of the selection all
      // return it once. role=generic (span) and role=paragraph (p) prohibit aria-label, so those two
      // are exposed as an image with a text alternative; a heading can name itself.
      role: Tag === "span" || Tag === "p" ? "img" : undefined,
      "aria-label": children,
      className: cn("inline-block", className),
      ...props,
    },
    units.map((unit, index) =>
      // Whitespace is emitted as a bare text node, not as a unit of its own: inside an inline-block
      // a lone collapsible space is trimmed to zero width and words run together, while an
      // inline-block of U+00A0 is never trimmed at a line end and pushes wrapped centred lines
      // off-centre. Between the wrappers it is an ordinary space in the parent's inline formatting
      // context — full width mid-line, trimmed at a line end.
      /^\s+$/.test(unit) ? (
        unit
      ) : (
        <span key={index} aria-hidden className="inline-block overflow-hidden align-bottom">
          <span data-split-unit className="inline-block">
            {unit}
          </span>
        </span>
      )
    )
  )
}
