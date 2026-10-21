import { PAGE_FILL } from "./catalog"

/** The colour behind a snapshot: the live page colour, so the file matches what the user saw. */
export function pageFill(light: boolean): string {
  if (typeof document !== "undefined") {
    const color = getComputedStyle(document.body).backgroundColor
    if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color
  }
  return PAGE_FILL[light ? "light" : "dark"]
}
