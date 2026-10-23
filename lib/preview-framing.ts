/**
 * How each item is framed on its `/preview/<name>` page, which is also what the catalog's posters and hover
 * clips show. The frame is the card's 16:9 shape.
 *
 * - `fill`: the demo is stretched to the whole frame, at `zoom` if given. For backgrounds and for demos that
 *   are a box already (the carousel, and the scroll demos, which scroll inside a box of their own).
 * - `center`: the demo sits in the middle at `zoom`, so a line of text or a small card reads in a thumbnail.
 *   `fit` shrink-wraps a demo whose box is wider than what it draws, so what it draws is what is centred.
 * - `page`: a section, rendered as a page. Its docs iframe shows it full size; it is filmed at `zoom`.
 */
export type Framing =
  | { kind: "fill"; zoom?: number }
  | { kind: "center"; zoom: number; fit?: boolean }
  | { kind: "page"; zoom: number }

/** The layout size a preview is filmed at. Captures are taken at two thirds of it: 640 × 360 pixels. */
export const PREVIEW_SIZE = { width: 960, height: 540 } as const

const FRAMING: Record<string, Framing> = {
  "aurora-background": { kind: "fill" },
  "pattern-waves": { kind: "fill" },
  grainient: { kind: "fill" },
  "dot-grid": { kind: "fill" },
  "gradient-carousel": { kind: "fill" },
  "scroll-portal": { kind: "fill" },
  "tile-reveal": { kind: "fill" },
  "scroll-mask": { kind: "fill" },
  "text-scroll-highlight": { kind: "fill", zoom: 1.5 },
  "text-shimmer": { kind: "center", zoom: 2.2 },
  "split-text": { kind: "center", zoom: 1.7 },
  venom: { kind: "fill" },
  marquee: { kind: "center", zoom: 1.9 },
  "spotlight-card": { kind: "center", zoom: 2.2 },
  "scroll-reveal": { kind: "center", zoom: 2 },
  tabs: { kind: "center", zoom: 2.1, fit: true },
  collapsible: { kind: "center", zoom: 2.1 },
  "hero-aurora": { kind: "page", zoom: 1 },
  "features-spotlight": { kind: "page", zoom: 0.9 },
}

export function framingFor(name: string, isBlock: boolean): Framing {
  return FRAMING[name] ?? (isBlock ? { kind: "page", zoom: 0.75 } : { kind: "center", zoom: 1.4 })
}
