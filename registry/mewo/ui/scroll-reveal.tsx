"use client"

import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

export type RevealDirection = "up" | "down" | "left" | "right" | "none"

export interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  direction?: RevealDirection
  /** Pixels travelled during the reveal. */
  distance?: number
  delay?: number
  duration?: number
  /** Reveal once, or every time it enters the viewport. */
  once?: boolean
}

/** Where the element starts so that it travels in `direction` to its resting place. */
export function revealOffset(direction: RevealDirection, distance: number): { x: number; y: number } {
  switch (direction) {
    case "up":
      return { x: 0, y: distance }
    case "down":
      return { x: 0, y: -distance }
    case "left":
      return { x: distance, y: 0 }
    case "right":
      return { x: -distance, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

export function ScrollReveal({
  direction = "up",
  distance = 24,
  delay = 0,
  duration = 0.6,
  once = true,
  className,
  children,
  ...props
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      data-slot="scroll-reveal"
      // `initial` must not depend on reduced motion: it is serialised into the SSR markup,
      // which the server always renders unreduced. A zero-duration transition snaps a
      // reduced-motion visitor straight to the final state instead of animating to it.
      initial={{ opacity: 0, ...revealOffset(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-10%" }}
      transition={reduceMotion ? { duration: 0 } : { duration, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
