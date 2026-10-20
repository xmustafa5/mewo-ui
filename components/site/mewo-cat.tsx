"use client"

import * as React from "react"
import { BODY_PATH, EYE_PATHS, MARK_VIEWBOX, PIXEL_PATHS, PUPILS } from "@/components/site/mewo-mark"
import { cn } from "@/lib/utils"

/** How far a pupil may travel, in the mark's own units. Down only: above the lid line it is hidden. */
const REACH_X = 34
const REACH_Y = 15

/**
 * The mascot: the mewo cat, blinking now and then and watching the pointer. With reduced motion
 * it sits still — no tracking, no blink, no pixel pulse.
 */
export function MewoCat({ className, ...props }: React.ComponentProps<"svg">) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const pupilRefs = React.useRef<(SVGCircleElement | null)[]>([])

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0

    function onPointerMove(event: PointerEvent) {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const svg = svgRef.current
        if (!svg) return
        const rect = svg.getBoundingClientRect()
        const scale = rect.width / MARK_VIEWBOX.width
        PUPILS.forEach((pupil, index) => {
          const element = pupilRefs.current[index]
          if (!element) return
          const dx = event.clientX - (rect.left + (pupil.cx - MARK_VIEWBOX.x) * scale)
          const dy = event.clientY - (rect.top + (pupil.cy - MARK_VIEWBOX.y) * scale)
          const distance = Math.hypot(dx, dy) || 1
          // Full reach once the pointer is a few hundred pixels away; a gentle drift up close.
          const pull = Math.min(1, distance / 320)
          const x = (dx / distance) * REACH_X * pull
          const y = Math.max(0, (dy / distance) * REACH_Y * pull)
          element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        })
      })
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={`${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("text-brand", className)}
      {...props}
    >
      <path fill="currentColor" d={BODY_PATH} />
      {PIXEL_PATHS.map((d, index) => (
        <path
          key={d}
          fill="currentColor"
          d={d}
          className="motion-safe:animate-[mewo-pixel-flicker_3.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${index * 0.4}s` }}
        />
      ))}
      {/* Pupils are cat-coloured, so whatever drifts off the white simply disappears into the face. */}
      <g className="origin-top [transform-box:fill-box] motion-safe:animate-[mewo-blink_6s_ease-in-out_infinite]">
        {EYE_PATHS.map((d) => (
          <path key={d} fill="#fff" d={d} />
        ))}
      </g>
      {PUPILS.map((pupil, index) => (
        <circle
          key={pupil.cx}
          ref={(element) => {
            pupilRefs.current[index] = element
          }}
          fill="currentColor"
          className="transition-transform duration-150 ease-out"
          {...pupil}
        />
      ))}
    </svg>
  )
}
