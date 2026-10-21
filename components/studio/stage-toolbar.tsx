"use client"

import { Camera, Download, Link2, Maximize, Pause, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContentMode } from "./content-overlay"
import { brandButtonClass, groupClass, IconButton, toolClass, Track, type TrackOption } from "./ui"

export function StageToolbar({
  picker,
  mode,
  modes,
  onModeChange,
  paused,
  disabled,
  onTogglePause,
  onRestart,
  onSnapshot,
  onFullscreen,
  onCopyLink,
  onExport,
}: {
  picker: React.ReactNode
  mode: ContentMode
  modes: TrackOption<ContentMode>[]
  onModeChange: (mode: ContentMode) => void
  paused: boolean
  disabled: boolean
  onTogglePause: () => void
  onRestart: () => void
  onSnapshot: () => void
  onFullscreen: () => void
  onCopyLink: () => void
  onExport: () => void
}) {
  return (
    <div className="flex min-h-9 flex-none flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:contents">
        {picker}
        <Track
          label="Preview content"
          value={mode}
          options={modes}
          onChange={onModeChange}
          iconOnly
          className="w-fit"
        />
      </div>

      <div className="flex items-center gap-2 max-sm:ml-auto">
        <div role="group" aria-label="Preview controls" className={groupClass}>
          <IconButton
            label={paused ? "Play" : "Pause"}
            hint="Space"
            icon={paused ? Play : Pause}
            onClick={onTogglePause}
            disabled={disabled}
          />
          <IconButton label="Replay intro" hint="R" icon={RotateCcw} onClick={onRestart} disabled={disabled} />
          <IconButton label="Save snapshot" hint="S" icon={Camera} onClick={onSnapshot} disabled={disabled} />
          <IconButton label="Fullscreen" hint="F" icon={Maximize} onClick={onFullscreen} />
        </div>

        <button
          type="button"
          aria-label="Copy link"
          title="Copy link"
          onClick={onCopyLink}
          className={cn(toolClass, "w-9 px-0")}
        >
          <Link2 aria-hidden />
        </button>

        <button
          type="button"
          title="Code, image or video (E)"
          onClick={onExport}
          className={cn(brandButtonClass, "max-sm:w-9 max-sm:px-0")}
        >
          <Download aria-hidden />
          <span className="max-sm:sr-only">Export</span>
        </button>
      </div>
    </div>
  )
}
