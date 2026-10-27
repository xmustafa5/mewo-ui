"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type MarkupPart = { kind: "text" | "em" | "link"; value: string }

/** Splits copy written with *italic* and [linked words] markup into parts. */
export function parseMarkup(text: string): MarkupPart[] {
  const out: MarkupPart[] = []
  const re = /\*([^*]+)\*|\[([^\]]+)\]/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ kind: "text", value: text.slice(last, m.index) })
    out.push(m[1] ? { kind: "em", value: m[1] } : { kind: "link", value: m[2]! })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) })
  return out
}

export interface RichTextProps extends React.ComponentProps<"p"> {
  /** Copy with *italic* and [linked words] markup. */
  text?: string
  /** Where the linked words point (they open in a new tab). */
  href?: string
}

/** A paragraph of story copy: *italic* words, and [linked words] with a small arrow. */
export function RichText({ text = "Story copy with *italic* words and a [linked phrase].", href = "#", className, ...props }: RichTextProps) {
  return (
    <p data-slot="rich-text" className={cn(className)} {...props}>
      {parseMarkup(text).map((p, i) =>
        p.kind === "em" ? (
          <em key={i}>{p.value}</em>
        ) : p.kind === "link" ? (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto underline decoration-[0.06em] underline-offset-[0.12em] transition-opacity hover:opacity-70 motion-reduce:transition-none"
          >
            {p.value}
            <svg className="ml-[0.08em] inline-block size-[0.45em] align-[0.5em]" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </a>
        ) : (
          p.value
        )
      )}
    </p>
  )
}
