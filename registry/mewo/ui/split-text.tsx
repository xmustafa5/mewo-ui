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

export function splitUnits(text: string, by: "chars" | "words"): string[] {
  if (by === "words") return text.split(/(\s+)/).filter((unit) => unit.length > 0)
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
      "aria-label": children,
      className: cn("inline-block", className),
      ...props,
    },
    units.map((unit, index) => (
      <span key={index} aria-hidden className="inline-block overflow-hidden align-bottom">
        <span data-split-unit className="inline-block">
          {/^\s+$/.test(unit) ? " " : unit}
        </span>
      </span>
    ))
  )
}
