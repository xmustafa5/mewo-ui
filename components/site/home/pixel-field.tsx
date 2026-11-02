import { cn } from "@/lib/utils"

const COLS = 30
const ROWS = 16
const PITCH = 22
const SIZE = 4
/** The pulsing cells are spread over this many phases of the pulse, each a layer of its own. */
const PHASES = 8
const PULSE_SECONDS = 4

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

const VIEW_BOX = `0 0 ${COLS * PITCH} ${ROWS * PITCH}`
const layerClass = "absolute inset-0 size-full"

/**
 * A field of small squares — the pixel motif blown up into a backdrop. A few cells pulse in the
 * brand colour; with reduced motion they hold still at full strength.
 *
 * The still cells and the trio are one SVG. The pulsing cells are spread over a few more, one per phase
 * of the pulse, and it is each of those SVGs that animates, not the cells in it: a shape inside an SVG
 * cannot be composited, so animating it has the main thread restyle and repaint the whole field on
 * every frame, wherever the reader is on the page. An SVG element's own opacity is compositor work.
 */
export function PixelField({ className }: { className?: string }) {
  const still: React.ReactNode[] = []
  const phases: React.ReactNode[][] = Array.from({ length: PHASES }, () => [])
  // the pulsing cells take the phases in turn, so neighbours never pulse together
  let pulsing = 0
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const inTrio = TRIO.some(([c, r]) => c === col && r === row)
      const lit = inTrio || isLit(col, row)
      const cell = (
        <rect
          key={`${col}-${row}`}
          x={col * PITCH}
          y={row * PITCH}
          width={inTrio ? PITCH : SIZE}
          height={inTrio ? PITCH : SIZE}
          className={lit ? "fill-brand" : "fill-foreground/15"}
        />
      )
      if (lit && !inTrio) phases[pulsing++ % PHASES].push(cell)
      else still.push(cell)
    }
  }

  return (
    <div aria-hidden className={cn("mask-[radial-gradient(ellipse_at_70%_35%,black_20%,transparent_70%)]", className)}>
      <svg viewBox={VIEW_BOX} preserveAspectRatio="xMaxYMin slice" className={layerClass}>
        {still}
      </svg>
      {phases.map((cells, phase) => (
        <svg
          key={phase}
          data-pulse-phase={phase}
          viewBox={VIEW_BOX}
          preserveAspectRatio="xMaxYMin slice"
          className={cn(layerClass, "motion-safe:animate-[mewo-pixel-pulse_4s_ease-in-out_infinite]")}
          style={{ animationDelay: `${(phase * PULSE_SECONDS) / PHASES}s` }}
        >
          {cells}
        </svg>
      ))}
    </div>
  )
}
