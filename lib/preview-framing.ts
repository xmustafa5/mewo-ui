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
  "pattern-waves": { kind: "fill" },
  grainient: { kind: "fill" },
  "dot-grid": { kind: "fill" },
  "gradient-carousel": { kind: "fill" },
  "scroll-portal": { kind: "fill" },
  "tile-reveal": { kind: "fill" },
  "scroll-mask": { kind: "fill" },
  "text-shimmer": { kind: "center", zoom: 2.2 },
  "split-text": { kind: "center", zoom: 1.7 },
  venom: { kind: "fill" },
  marquee: { kind: "center", zoom: 1.9 },
  "spotlight-card": { kind: "center", zoom: 2.2 },
  "album-rail": { kind: "center", zoom: 1 },
  // the story pieces: each demo is a box of its own (a scroll box, a pinned stage, a contained frame), so it fills the card
  "zoom-panel": { kind: "fill" },
  "chapter-nav": { kind: "fill" },
  "glass-panel": { kind: "fill" },
  "scroll-captions": { kind: "fill" },
  "rising-captions": { kind: "fill" },
  "zoom-picture": { kind: "fill" },
  "date-timeline": { kind: "fill" },
  "picture-cloud": { kind: "fill" },
  "picture-wave": { kind: "fill" },
  "picture-orbit": { kind: "fill" },
  "picture-trail": { kind: "fill" },
  "names-duel": { kind: "fill" },
  "portrait-pair": { kind: "fill" },
  // carousels and walls that fill a box of their own, and a single card and a strip of cards centred
  "concave-carousel": { kind: "fill" },
  // its pictures are 560px tall: filmed smaller, so they fit the card whole
  "parallax-carousel": { kind: "fill", zoom: 0.8 },
  "depth-image": { kind: "fill" },
  "tilted-tiles": { kind: "fill" },
  "prism-carousel": { kind: "fill" },
  "depth-card": { kind: "center", zoom: 1.4 },
  "skewed-carousel": { kind: "center", zoom: 1.2 },
}

export function framingFor(name: string, isBlock: boolean): Framing {
  return FRAMING[name] ?? (isBlock ? { kind: "page", zoom: 0.75 } : { kind: "center", zoom: 1.4 })
}
