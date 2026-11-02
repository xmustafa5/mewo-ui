/**
 * Placeholder cats for the demos and the Customize panels, from cataas.com (Cat as a Service, which serves them with
 * CORS): each a fixed cat by id, so a demo shows the same pictures every time and its filmed card matches. The
 * registry components carry their own lists; these are for the pictures the demos and panels choose themselves.
 * `small` is about 300px wide, `medium` 400px, `square` 200 × 200; without a size the original, up to 1280px.
 */
export type CatSize = "small" | "medium" | "square"

export const cat = (id: string, size?: CatSize) => `https://cataas.com/cat/${id}${size ? `?type=${size}` : ""}`

/** The widths the site asks the optimizer for: Next's own size list, so every request is one it serves. */
export type Width = 256 | 384 | 640 | 1080 | 1200

/**
 * The site's copy of a picture: Next's image optimizer resizes it to `width`, serves WebP or AVIF, caches it on the
 * CDN for a month and keeps it same-origin, so the WebGL pieces need no CORS. The registry components keep the
 * plain addresses, which is what installs into a project.
 */
export const optimized = (url: string, width: Width) => `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`

/** A picture object with its `src` optimized. */
export const optimizedOne = <T extends { src: string }>(item: T, width: Width): T => ({ ...item, src: optimized(item.src, width) })

/** A list of picture objects, every `src` optimized. */
export const optimizedAll = <T extends { src: string }>(items: readonly T[], width: Width): T[] => items.map((item) => optimizedOne(item, width))

/** Picks from a list by a 1-based picture number, round and round. */
export const pick = (ids: readonly string[], picture: number) => ids[(((picture - 1) % ids.length) + ids.length) % ids.length]

/** Eight portrait cats for the Gradient Carousel's demo and panel. */
export const GRADIENT_CATS = ["1KeQpy7eHqi0SFmc", "1Y3dpssxcbHPEkfO", "2lnVocnpd25cUka7", "2xkeeR99sD9uaqre", "3B3hpEDNeHSVKii0", "AVCQprn27w2b4mLB", "bJCwfolcg9LYnc61", "5dXZ2o7tBtnsFIYH"].map((id) => optimized(cat(id), 1080))

/** Twelve cats for the Tile Reveal's demo and panel. */
export const TILE_CATS = ["JazIRPFqDYCXNJaA", "ngfJ6lSzEdJQ9GO8", "1wpap8yckt96vOoU", "2wfWxhA4oS7bGUFW", "2XYz3V6PILrrvZn6", "43hNBvUK9fAKsHv3", "4v9FDCzfJ9WkSn2V", "5RbMoA2duqnmB8ez", "98qvAp6CYXZMLztN", "SXLh7Co7iYYEVVgi", "B2n9aaCoiKybcCzZ", "Hf6aYSyQA6KvwdCC"].map((id) => optimized(cat(id), 384))

/** Nine wide cats the Zoom Panel's panel pages through. */
export const ZOOM_PANEL_CATS = ["UVu5vTLianSvI6Ju", "PA2gYEbMCzaiDrWv", "ISzhEQ0qfoB9Mb2K", "BULkVjFcQkTq9T0e", "BgStpOSAyjeFKwRG", "YKkUmzQHZGO4BBZk", "q7mJuNyrzGDoC1XS", "CyHhy2hqLNBoraUt", "OQW6RVeKZQ4iIPnQ"]

/** Nine tall cats the Zoom Picture's panel pages through. */
export const ZOOM_PICTURE_CATS = ["2lo2luOySDGPFCng", "3pr4EmlAcw5PczC9", "5EbGLS0zHq1p1TTd", "6SOOsD3JbXiiTDqI", "86D30ProCL43mzsd", "AamyBgrQMbcgrTrP", "aonUpTntYMPno4yt", "aQ2vEZGmfndx0TuY", "B2yEv3VpuqOrL0E0"]

/** Nine near-square cats the Picture Trail's panel pages through. */
export const PICTURE_TRAIL_CATS = ["2lnVocnpd25cUka7", "2xkeeR99sD9uaqre", "BswnFbCjndW2X9oO", "HTjBKfHqCZn9lkRt", "bJCwfolcg9LYnc61", "XwExNWpQwNvHBomN", "P7XxICTz4kfqrwB0", "pprtOJkIJ9U0hDjG", "wJ6jNK5jAvjNbgvb"]

/** The cats the Picture Cloud's panel tiles with, round and round, at the square size. */
export const CLOUD_CATS = [
  "9KJtZfvlNhq7KbAm", "eM4t8b4yK9eu2hPm", "h4QKV0SMYKgSqHKV", "qEUtU3MgNTamybTm", "RGUEWaEBQfkVW8zJ", "YqxwxAM4KsP47qTE",
  "3OI0zHkZS3RCb8xa", "0F0IKAPOdWiE755P", "0mstmOIucwiN80jb", "1bJraW0IwSPm3MVd", "1N2AH31jiY6N9TYc", "2AjkEyDta2fk44NE",
  "2Bb8z8bR1w5EFHhz", "2eXYJhGolHqOAKaM", "2xsQpqvspMC4OjXs", "3zM2HCQRdiZHB3Oo", "4cnQObJyASFknf5L", "5enhMoq1fey3akP5",
  "7b6yOergmSkMZH7w", "7d7EPnouLU1Vwkdc", "7VVdI0PDAwo0GLeJ", "7XiIbdzOHlTxZZHm", "89ddp91tTolLtlPz", "9hrU6WQjC4dn75hm",
  "A8f9fzuNUo7m54Jn", "aKJD8Z7P8bQ8FDZ8", "BcBdLFp6n00qaTAm", "blCoC4jk99A5ChEC", "bOakL3BtHlryCLW3", "3xajd1BkJ3RbfSkx",
  "GILRuBVxMjB0htly", "BuhnkqtpZqAxfsqQ", "iTmHMagWzAFn7fWM", "mJ75VJU1htTphntH", "mrPYfaRfJqUmxHN0", "nxxtDWRE2dbpfM4D",
  "OZMYTHi2vMfUZEz0", "ToFVsijtJWykEzKp", "VCV7NVM2hPvTPCc2", "xAeSjzULC9p4K8dz", "7xrDGcZqKEL4VTAM", "G2gU9xo3HUvi70LL",
  "i17rOOhMY9XBvrUr", "NuCbxqOj92foqkh4", "S7LsxaFfwWhOZ6ir", "TTY9yyybuIJMHYWs", "um3WTSJgjcOYucjo", "UPOwrNmxZARXkZuV",
]

/** The pictures of the Names — Duel demo and panel, with their proportions: one duel of one, one of two. */
export const NAMES_DUEL_CATS = [
  { src: optimized("https://cataas.com/cat/43hNBvUK9fAKsHv3", 1200), ratio: 800 / 747 },
  { src: optimized("https://cataas.com/cat/37guCJ2aCCt3m360", 1200), ratio: 738 / 900 },
  { src: optimized("https://cataas.com/cat/hquA1XbCI8OA5kwI", 1200), ratio: 750 / 750 },
]
