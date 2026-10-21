"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { BackgroundList } from "./background-list"
import type { StudioEntry } from "./types"
import { toolClass } from "./ui"

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches

/** The background chooser for layouts too narrow for the rail: a popover on desktop, a sheet on phones. */
export function Picker({ entry, onSelect }: { entry: StudioEntry; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0 max-sm:w-full">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(toolClass, "max-w-56 justify-between gap-1.5 pr-2.5 pl-3 max-sm:w-full max-sm:max-w-none")}
      >
        <span className="truncate">{entry.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {open ? (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 sm:hidden"
          />
          <div
            role="dialog"
            aria-label="Choose a background"
            className={cn(
              "z-50 flex flex-col rounded-2xl border bg-popover p-3 text-popover-foreground shadow-2xl shadow-black/30",
              "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[min(76dvh,640px)] max-sm:rounded-b-none max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:animate-in max-sm:duration-250 max-sm:slide-in-from-bottom-8",
              "sm:absolute sm:top-[calc(100%+0.5rem)] sm:left-0 sm:h-[min(520px,70vh)] sm:w-[300px] sm:animate-in sm:duration-150 sm:fade-in sm:slide-in-from-top-1",
            )}
          >
            <BackgroundList
              activeId={entry.id}
              autoFocus={finePointer()}
              onEscape={() => setOpen(false)}
              onSelect={(id) => {
                onSelect(id)
                setOpen(false)
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
