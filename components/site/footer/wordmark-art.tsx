"use client"

import * as React from "react"

const WORD = "mewo"
const WEIGHT = 600
/** How much of the word's height shows above the card's bottom edge. */
const SHOWN = 0.6
/** Where the fade from the top finishes, as a share of the word's height below its top. */
const FADE = 0.4

/**
 * One 36px tile of the field: a 4 by 4 block of 9px cells, each a pixel of mewo's stepped-square motif,
 * in two sizes and a spread of strengths so the field reads as texture rather than a grid.
 */
const CELLS = Array.from({ length: 16 }, (_, index) => {
  const column = index % 4
  const row = Math.floor(index / 4)
  const size = (index + row) % 3 === 1 ? 3 : 5
  return {
    x: column * 9 + (9 - size) / 2,
    y: row * 9 + (9 - size) / 2,
    size,
    opacity: 0.42 + ((index * 7) % 5) * 0.12,
  }
})

type Layout = { height: number; font: number; x: number; y: number; fade: number; cell: number }

/**
 * The footer's closing art: "mewo" cut out of a field of pixels, sized to span the card between its
 * text insets, faded in from the top and cut off below so only the top of the word shows. Static SVG,
 * so it costs nothing after the first paint. The word is measured with the page's own font once fonts
 * have loaded, and again whenever the card changes width.
 */
export function WordmarkArt() {
  const id = React.useId().replace(/[^\w-]/g, "")
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const [layout, setLayout] = React.useState<Layout | null>(null)

  React.useEffect(() => {
    if (!node) return
    let cancelled = false

    const update = () => {
      const width = node.clientWidth
      const context = document.createElement("canvas").getContext("2d")
      if (cancelled || !width || !context) return
      context.font = `${WEIGHT} 100px ${getComputedStyle(node).fontFamily}`
      const metrics = context.measureText(WORD)
      const left = metrics.actualBoundingBoxLeft / 100
      const right = metrics.actualBoundingBoxRight / 100
      const ascent = metrics.actualBoundingBoxAscent / 100
      const descent = metrics.actualBoundingBoxDescent / 100

      // Line the word up with the links above it: the same inset on both sides.
      const top = node.parentElement?.querySelector<HTMLElement>("[data-footer-top]")
      const inset = top ? Number.parseFloat(getComputedStyle(top).paddingLeft) || 0 : 0
      const font = Math.max(24, (width - inset * 2) / (left + right))
      const glyph = font * (ascent + descent)
      const above = Math.max(24, glyph * 0.32)

      setLayout({
        height: above + glyph * SHOWN,
        font,
        x: width / 2 - ((right - left) * font) / 2,
        y: above + ascent * font,
        fade: above + glyph * FADE,
        cell: Math.min(9, Math.max(3, Math.round(width / 135))),
      })
    }

    const observer = new ResizeObserver(update)
    observer.observe(node)
    void document.fonts?.ready.then(update)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [node])

  return (
    <div
      ref={setNode}
      aria-hidden
      className="pointer-events-none relative mt-[clamp(2.5rem,4.5vw,4.5rem)] h-[clamp(7.5rem,17vw,16rem)] w-full overflow-hidden text-[color-mix(in_oklch,var(--muted-foreground)_42%,transparent)] mask-[linear-gradient(to_bottom,transparent,black_var(--fade,6rem))] [contain:layout_paint] dark:text-[color-mix(in_oklch,var(--muted-foreground)_38%,transparent)]"
      style={layout ? ({ height: layout.height, "--fade": `${layout.fade}px` } as React.CSSProperties) : undefined}
    >
      <svg className="absolute inset-0 size-full" focusable="false">
        <defs>
          <pattern
            id={`${id}-cells`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${(layout?.cell ?? 9) / 9})`}
          >
            <g fill="currentColor">
              {CELLS.map((cell) => (
                <rect
                  key={`${cell.x}-${cell.y}`}
                  x={cell.x}
                  y={cell.y}
                  width={cell.size}
                  height={cell.size}
                  opacity={cell.opacity}
                />
              ))}
            </g>
          </pattern>
          <mask id={`${id}-word`}>
            <rect width="100%" height="100%" fill="white" />
            {layout ? (
              <text x={layout.x} y={layout.y} fill="black" fontSize={layout.font} fontWeight={WEIGHT}>
                {WORD}
              </text>
            ) : null}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}-cells)`} mask={`url(#${id}-word)`} />
      </svg>
    </div>
  )
}
