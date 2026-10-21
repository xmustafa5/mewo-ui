"use client"

import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Code2, Image, Video, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CodeExport } from "./code-export"
import type { StudioState } from "./hooks/use-studio-state"
import { MediaExport } from "./media-export"
import type { Layout } from "./sizes"
import { toolClass, Track, type TrackOption } from "./ui"

export type ExportTab = "code" | "image" | "video"

const TABS: TrackOption<ExportTab>[] = [
  { value: "code", label: "Code", icon: Code2 },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
]

const remembered: { tab: ExportTab | null } = { tab: null }

export function ExportDialog({
  initialTab,
  state,
  stageSize,
  onClose,
}: {
  initialTab: ExportTab
  state: StudioState
  stageSize: Layout | null
  onClose: () => void
}) {
  const [tab, setTabState] = useState<ExportTab>(() => remembered.tab ?? initialTab)
  const [busy, setBusy] = useState(false)

  const setTab = (value: ExportTab) => {
    remembered.tab = value
    setTabState(value)
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // A render in progress keeps the dialog open; Cancel is the way out.
        if (!open && !busy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(820px,calc(100dvh-2rem))] w-[min(1040px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-black/40 outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <header className="flex flex-none flex-wrap items-center gap-3 px-5 pt-4 pb-3">
            <Dialog.Title className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
              Export {state.entry.label}
            </Dialog.Title>
            <Track
              label="Export as"
              value={tab}
              options={TABS.map((item) => ({ ...item, disabled: busy && item.value !== tab }))}
              onChange={setTab}
              className="max-sm:order-3 max-sm:w-full sm:w-fit"
            />
            <Dialog.Close aria-label="Close" disabled={busy} className={cn(toolClass, "w-9 px-0")}>
              <X aria-hidden />
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 scrollbar-thin">
            {tab === "code" ? (
              <CodeExport state={state} />
            ) : (
              <MediaExport key={tab} kind={tab} state={state} stageSize={stageSize} onBusyChange={setBusy} />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
