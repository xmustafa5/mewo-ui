"use client"

import * as React from "react"
import { NAMESPACE, SITE_URL } from "@/lib/site"

export function InstallCommand({ name, isBlock = false }: { name: string; isBlock?: boolean }) {
  const command = `npx shadcn@latest add ${NAMESPACE}/${name}`
  // Sections list their parts as `@mewo/...`, which the CLI can only resolve from a configured
  // registry — the raw-URL form fails for them with `Unknown registry "@mewo"`.
  const fallback = isBlock
    ? JSON.stringify({ registries: { [NAMESPACE]: `${SITE_URL}/r/{name}.json` } }, null, 2)
    : `npx shadcn@latest add ${SITE_URL}/r/${name}.json`
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
        <p className="mt-2">
          {isBlock
            ? `This section installs other ${NAMESPACE} items, so the namespace has to be in your components.json. Add it, then run the command above:`
            : "Point the CLI straight at the item URL:"}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border px-3 py-2 font-mono">{fallback}</pre>
      </details>
    </div>
  )
}
