"use client"

import * as React from "react"
import { Check, Copy, Terminal } from "lucide-react"
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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card/60">
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
          <Terminal className="size-3.5" aria-hidden />
          Terminal
          <button
            type="button"
            onClick={copy}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-brand-text" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-4 font-mono text-sm">
          <span aria-hidden className="text-brand-text select-none">
            $
          </span>
          <code className="flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
        </div>
      </div>
      <details className="group text-sm text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">Not using the registry directory?</summary>
        <p className="mt-2">
          {isBlock
            ? `This section installs other ${NAMESPACE} items, so the namespace has to be in your components.json. Add it, then run the command above:`
            : "Point the CLI straight at the item URL:"}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl border bg-card/60 px-4 py-3 font-mono text-xs text-foreground">{fallback}</pre>
      </details>
    </div>
  )
}
