"use client"

import * as React from "react"
import { NAMESPACE, SITE_URL } from "@/lib/site"

export function InstallCommand({ name }: { name: string }) {
  const command = `npx shadcn@latest add ${NAMESPACE}/${name}`
  const fallback = `npx shadcn@latest add ${SITE_URL}/r/${name}.json`
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-sm">
        <code className="flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
        <button type="button" onClick={copy} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Not using the registry directory?</summary>
        <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md border px-3 py-2 font-mono">{fallback}</code>
      </details>
    </div>
  )
}
