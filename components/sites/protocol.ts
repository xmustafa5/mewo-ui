// What the viewer and a framed site say to each other over postMessage. Every message carries the site's `source`
// (its slug), and the viewer accepts messages from the site's origin only.
//
//   viewer → site   hello                      asks for ready again
//                   inspect { on, pieces }     the inspector, with the pieces to outline
//   site → viewer   ready { locale }           the site is up and listening
//                   select { name }            a click or a tap on an outlined piece
//                   open { name }              a double-click on one
//                   escape                     Escape while inspecting

/** A piece of the site as the viewer knows it. */
export type SitePiece = { name: string; title: string; description: string; hasPreview: boolean; unlisted: boolean }

/** What the site is asked to outline: the piece's name, the label to draw, and a tag for a simple piece. */
export type PieceSpec = { name: string; label: string; tag?: string }

export type SiteMessage = { type: "ready"; locale?: string } | { type: "select"; name: string } | { type: "open"; name: string } | { type: "escape" }

export const pieceSpecs = (pieces: SitePiece[]): PieceSpec[] =>
  pieces.map((p) => (p.unlisted ? { name: p.name, label: p.title, tag: "simple" } : { name: p.name, label: p.title }))

/** The message in an event from the site, or null when it is not one (another origin, another source, bad shape). */
export function parseMessage(event: { origin: string; data: unknown }, origin: string, source: string): SiteMessage | null {
  if (event.origin !== origin || !event.data || typeof event.data !== "object") return null
  const data = event.data as { source?: unknown; type?: unknown; name?: unknown; locale?: unknown }
  if (data.source !== source) return null
  if (data.type === "ready") return { type: "ready", locale: typeof data.locale === "string" ? data.locale : undefined }
  if (data.type === "escape") return { type: "escape" }
  if ((data.type === "select" || data.type === "open") && typeof data.name === "string") return { type: data.type, name: data.name }
  return null
}
