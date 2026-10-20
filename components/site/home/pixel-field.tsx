import { cn } from "@/lib/utils"

const COLS = 30
const ROWS = 16
const PITCH = 22
const SIZE = 4

/** Cells that light up. Deterministic, so the server and the client draw the same field. */
function isLit(col: number, row: number) {
  return (col * 7 + row * 13 + col * row) % 23 === 0
}

/** The cat's stepped trio, drawn into the brightest part of the field. */
const TRIO = [
  [19, 4],
  [20, 5],
  [21, 6],
]

/**
 * A field of small squares — the pixel motif blown up into a backdrop. A few cells pulse in the
 * brand colour; with reduced motion they hold still at full strength.
 */
export function PixelField({ className }: { className?: string }) {
  const cells: React.ReactNode[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const inTrio = TRIO.some(([c, r]) => c === col && r === row)
      const lit = inTrio || isLit(col, row)
      cells.push(
        <rect
          key={`${col}-${row}`}
          x={col * PITCH}
          y={row * PITCH}
          width={inTrio ? PITCH : SIZE}
          height={inTrio ? PITCH : SIZE}
          className={cn(
            lit ? "fill-brand" : "fill-foreground/15",
            lit && !inTrio && "motion-safe:animate-[mewo-pixel-pulse_4s_ease-in-out_infinite]"
          )}
          style={lit && !inTrio ? { animationDelay: `${((col * 31 + row * 17) % 40) / 10}s` } : undefined}
        />
      )
    }
  }

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${COLS * PITCH} ${ROWS * PITCH}`}
      preserveAspectRatio="xMaxYMin slice"
      className={cn("mask-[radial-gradient(ellipse_at_70%_35%,black_20%,transparent_70%)]", className)}
    >
      {cells}
    </svg>
  )
}
