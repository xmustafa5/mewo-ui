import { readFileSync, writeFileSync } from "node:fs"
import { serializeCss, type CssItem } from "../lib/registry-css"

const registry = JSON.parse(readFileSync("registry.json", "utf8")) as { items: CssItem[] }
writeFileSync("app/registry.css", serializeCss(registry.items))
console.log(`app/registry.css written (${registry.items.filter((i) => i.css).length} item(s) with css)`)
