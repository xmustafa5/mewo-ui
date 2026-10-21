"use client"

import { useCallback, useState } from "react"
import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

type Kind = "success" | "error"
type Toast = { id: number; message: string; kind: Kind }

let counter = 0

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, kind: Kind = "success") => {
    counter += 1
    const id = counter
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2400)
  }, [])

  return { toasts, notify }
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-60 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-popover px-3.5 py-2 text-sm font-medium text-popover-foreground shadow-lg shadow-black/20 animate-in duration-200 fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
          )}
        >
          {toast.kind === "error" ? (
            <CircleAlert className="size-4 text-destructive" aria-hidden />
          ) : (
            <Check className="size-4 text-brand-text" aria-hidden />
          )}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
