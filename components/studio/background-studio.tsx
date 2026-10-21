"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BackgroundList } from "./background-list"
import { contentModesFor, contentView, type ContentMode } from "./content-overlay"
import { canvasToBlob, downloadBlob } from "./download"
import { ExportDialog, type ExportTab } from "./export-dialog"
import { useMediaQuery } from "./hooks/use-media-query"
import { useStageFrame } from "./hooks/use-stage-frame"
import { useStudioState } from "./hooks/use-studio-state"
import { Panel } from "./panel"
import { writeDocument } from "./params"
import { Picker } from "./picker"
import type { Layout } from "./sizes"
import { Stage } from "./stage"
import { StageToolbar } from "./stage-toolbar"
import { pageFill } from "./theme"
import { Toasts, useToasts } from "./toast"

const WIDE_QUERY = "(min-width: 1280px)"
const DESKTOP_QUERY = "(min-width: 1024px)"

const remembered = { mode: "none" as ContentMode }

const isEditable = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="slider"], [role="spinbutton"], [role="dialog"], [role="menu"], [role="listbox"]',
    ),
  )

/**
 * Background Studio. Pick a background, tune it, drop sample content over it, then take the code, an image or
 * a video. The URL is the document, so a link reproduces the exact look.
 */
export function BackgroundStudio() {
  const state = useStudioState()
  const { entry, light } = state
  const wide = useMediaQuery(WIDE_QUERY)
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const [mode, setModeState] = useState<ContentMode>(() => remembered.mode)
  const [narrow, setNarrow] = useState(false)
  const [exporting, setExporting] = useState<ExportTab | null>(null)
  const [stageSize, setStageSize] = useState<Layout | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const keyRef = useRef<(event: KeyboardEvent) => void>(() => {})
  const { toasts, notify } = useToasts()

  const onKeyDown = useCallback((event: KeyboardEvent) => keyRef.current(event), [])
  const frame = useStageFrame({ entry, renderProps: state.props, light, onKeyDown })
  const { togglePause, restart, snapshot } = frame

  const setMode = useCallback((value: ContentMode) => {
    remembered.mode = value
    setModeState(value)
  }, [])

  const view = contentView(mode, narrow)
  const modes = useMemo(() => contentModesFor(narrow), [narrow])

  const shareUrl = useCallback(() => {
    const query = writeDocument(state.doc, entry).toString()
    return `${window.location.origin}${window.location.pathname}?${query}`
  }, [state.doc, entry])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      notify("Link copied")
    } catch {
      notify("Could not copy the link", "error")
    }
  }, [shareUrl, notify])

  const saveSnapshot = useCallback(async () => {
    try {
      const canvas = await snapshot(pageFill(light))
      const blob = await canvasToBlob(canvas, "image/png")
      downloadBlob(blob, `${entry.id}-${canvas.width}x${canvas.height}.png`)
      notify("Snapshot saved")
    } catch {
      notify("Could not save a snapshot", "error")
    }
  }, [snapshot, light, entry.id, notify])

  const openExport = useCallback((tab: ExportTab) => {
    const rect = stageRef.current?.getBoundingClientRect()
    setStageSize(rect ? { width: rect.width, height: rect.height } : null)
    setExporting(tab)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const element = stageRef.current
    if (!element) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      return
    }
    element.requestFullscreen?.().catch(() => notify("Fullscreen is not available here", "error"))
  }, [notify])

  const { step, undo, redo } = state

  // Shortcuts work from the page and from inside the frame (the frame forwards its keydowns).
  useEffect(() => {
    keyRef.current = (event) => {
      if (exporting || event.defaultPrevented) return
      const key = event.key.toLowerCase()
      const modifier = event.metaKey || event.ctrlKey

      if (modifier && !event.altKey && (key === "z" || key === "y")) {
        if (event.target instanceof Element && event.target.matches("input, textarea")) return
        event.preventDefault()
        if (key === "y" || event.shiftKey) redo()
        else undo()
        return
      }

      if (modifier || event.altKey || isEditable(event.target)) return

      if (key === "arrowleft" || key === "arrowright") {
        if (event.shiftKey) return
        event.preventDefault()
        step(key === "arrowleft" ? -1 : 1)
      } else if (key === " ") {
        if (event.target instanceof Element && event.target.closest("button, a")) return
        event.preventDefault()
        togglePause()
      } else if (key === "r") {
        restart()
      } else if (key === "f") {
        toggleFullscreen()
      } else if (key === "s") {
        saveSnapshot()
      } else if (key === "e") {
        openExport("code")
      }
    }
  }, [exporting, redo, undo, step, togglePause, restart, toggleFullscreen, saveSnapshot, openExport])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyRef.current(event)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const picker = !wide ? <Picker entry={entry} onSelect={state.selectBackground} /> : null

  return (
    <div
      data-layout={wide ? "wide" : desktop ? "desktop" : "compact"}
      className="flex min-h-0 w-full flex-1 flex-col gap-4 max-lg:overflow-y-auto max-lg:overscroll-contain lg:grid lg:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[264px_minmax(0,1fr)_312px]"
    >
      {wide ? (
        <aside aria-label="Backgrounds" className="flex min-h-0 flex-col rounded-2xl border bg-card/50 p-3">
          <BackgroundList activeId={entry.id} onSelect={state.selectBackground} />
        </aside>
      ) : null}

      <section aria-label="Preview" className="flex min-h-0 flex-col gap-3 max-lg:flex-none">
        <StageToolbar
          picker={picker}
          mode={view}
          modes={modes}
          onModeChange={setMode}
          paused={frame.paused}
          disabled={!frame.bridge}
          onTogglePause={togglePause}
          onRestart={restart}
          onSnapshot={saveSnapshot}
          onFullscreen={toggleFullscreen}
          onCopyLink={copyLink}
          onExport={() => openExport("code")}
        />
        <Stage frame={frame} view={view} onNarrowChange={setNarrow} onRetry={restart} stageRef={stageRef} />
      </section>

      <Panel state={state} onStep={step} className="rounded-2xl border bg-card/50 p-3 max-lg:flex-none" />

      {exporting ? (
        <ExportDialog initialTab={exporting} state={state} stageSize={stageSize} onClose={() => setExporting(null)} />
      ) : null}
      <Toasts toasts={toasts} />
    </div>
  )
}
