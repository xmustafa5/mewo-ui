import type { Values } from "./types"
import { same } from "./use-customize"

/** The usage snippet a piece shows in its Code tab: the import and one element with the changed props. */
export type Usage = {
  /** The component's exported name. */
  name: string
  /** The registry item's name: the import comes from `@/components/ui/<item>`. */
  item: string
  /** The props to print, already reduced to the ones that differ from the defaults (`changedProps`). */
  props: Record<string, unknown>
  /** What goes between the tags, if anything: text or JSX, over one line or several. */
  children?: string
}

/**
 * The props worth printing: every control value that is a prop of the piece and differs from its default, then
 * the `computed` ones a piece derives (a `src` built from a picture number, a `className` from a size), which
 * come already reduced.
 */
export function changedProps(values: Values, defaults: Values, demoOnly: readonly string[] = [], computed: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (demoOnly.includes(key) || same(value, defaults[key])) continue
    out[key] = value
  }
  return { ...out, ...computed }
}

/** A prop's value as JSX: a string in quotes, a number or a list in braces, `true` as the bare prop (null). */
export function formatValue(value: unknown): string | null {
  if (typeof value === "string") return value.includes('"') || value.includes("\n") ? `{${JSON.stringify(value)}}` : `"${value}"`
  if (typeof value === "number") return `{${value}}`
  if (typeof value === "boolean") return value ? null : "{false}"
  if (Array.isArray(value)) return `{${JSON.stringify(value).replace(/,/g, ", ")}}`
  return `{${JSON.stringify(value)}}`
}

const WIDTH = 80
const indent = (text: string, by = "  ") =>
  text
    .split("\n")
    .map((line) => (line ? by + line : line))
    .join("\n")

/** The snippet as text, for the copy button. */
export function usageText({ name, item, props, children }: Usage): string {
  const attrs = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const formatted = formatValue(value)
      return formatted === null ? key : `${key}=${formatted}`
    })
  const inlineOpen = `<${name}${attrs.length ? ` ${attrs.join(" ")}` : ""}`
  const stacked = attrs.length > 0 && inlineOpen.length + 2 > WIDTH
  const open = stacked ? `<${name}\n${indent(attrs.join("\n"))}\n` : inlineOpen

  let element: string
  if (children === undefined || children === "") {
    element = stacked ? `${open}/>` : `${open} />`
  } else {
    const oneLine = !children.includes("\n") && `${inlineOpen}>${children}</${name}>`.length <= WIDTH
    element = oneLine && !stacked ? `${open}>${children}</${name}>` : `${open}>\n${indent(children)}\n</${name}>`
  }
  return `import { ${name} } from "@/components/ui/${item}"\n\n${element}`
}

export type TokenKind = "plain" | "keyword" | "tag" | "attr" | "string" | "value" | "text"
export type Token = { kind: TokenKind; text: string }

const IMPORT = /(\bimport\b|\bfrom\b|"[^"]*"|\s+|[A-Za-z_$][\w$]*|.)/g

/** The snippet split into coloured tokens, one list per line, for the highlighted block. */
export function tokenize(code: string): Token[][] {
  const lines: Token[][] = []
  let inTag = false
  for (const line of code.split("\n")) {
    const tokens: Token[] = []
    if (!inTag && /^\s*import\b/.test(line)) {
      for (const part of line.match(IMPORT) ?? []) {
        tokens.push({ kind: part === "import" || part === "from" ? "keyword" : part.startsWith('"') ? "string" : "plain", text: part })
      }
      lines.push(tokens)
      continue
    }
    let i = 0
    while (i < line.length) {
      const rest = line.slice(i)
      if (!inTag) {
        const lt = rest.indexOf("<")
        if (lt === -1) {
          tokens.push({ kind: "text", text: rest })
          break
        }
        if (lt > 0) tokens.push({ kind: "text", text: rest.slice(0, lt) })
        i += lt
        const close = /^<\/([\w.]+)>/.exec(line.slice(i))
        if (close) {
          tokens.push({ kind: "plain", text: "</" }, { kind: "tag", text: close[1] }, { kind: "plain", text: ">" })
          i += close[0].length
          continue
        }
        const open = /^<([\w.]+)/.exec(line.slice(i))
        if (open) {
          tokens.push({ kind: "plain", text: "<" }, { kind: "tag", text: open[1] })
          i += open[0].length
          inTag = true
          continue
        }
        tokens.push({ kind: "text", text: "<" })
        i += 1
        continue
      }
      let match: RegExpExecArray | null
      if ((match = /^\s+/.exec(rest))) tokens.push({ kind: "plain", text: match[0] })
      else if ((match = /^\/?>/.exec(rest))) {
        tokens.push({ kind: "plain", text: match[0] })
        inTag = false
      } else if ((match = /^"[^"]*"/.exec(rest))) tokens.push({ kind: "string", text: match[0] })
      else if (rest.startsWith("{")) {
        let depth = 0
        let end = 0
        for (; end < rest.length; end++) {
          if (rest[end] === "{") depth++
          else if (rest[end] === "}" && --depth === 0) break
        }
        match = [rest.slice(0, end + 1)] as unknown as RegExpExecArray
        tokens.push({ kind: "value", text: match[0] })
      } else if ((match = /^[\w-]+/.exec(rest))) tokens.push({ kind: "attr", text: match[0] })
      else {
        match = [rest[0]] as unknown as RegExpExecArray
        tokens.push({ kind: "plain", text: rest[0] })
      }
      i += match[0].length
    }
    lines.push(tokens)
  }
  return lines
}
