import registry from "@/registry.json"

export const SITE_NAME = "mewo"
export const SITE_URL: string = registry.homepage
export const NAMESPACE = "@mewo"
export const GITHUB_URL = "https://github.com/xmustafa5/mewo-ui"
/**
 * The shadcn CLI release each drop-in's exports and prop types were verified against by hand.
 * Not derived from package.json: that pin is a semver range, while this is a claim about what
 * was actually installed and diffed. Re-verify before changing it.
 */
export const SHADCN_VERSION = "4.21.0"
