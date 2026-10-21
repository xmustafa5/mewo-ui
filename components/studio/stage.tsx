"use client"

import { useEffect, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { ContentOverlay, NARROW_WIDTH, type ContentMode } from "./content-overlay"
import type { useStageFrame } from "./hooks/use-stage-frame"
import { Spinner, toolClass } from "./ui"

type Frame = ReturnType<typeof useStageFrame>

/**
 * The preview: the frame iframe, the sample content over it, and the loading, error and paused states. The
 * background itself lives entirely inside the iframe, a separate document with its own clock.
 */
export function Stage({
  frame,
  view,
  onNarrowChange,
  onRetry,
  stageRef,
}: {
  frame: Frame
  view: ContentMode
  onNarrowChange: (narrow: boolean) => void
  onRetry: () => void
  stageRef: RefObject<HTMLDivElement | null>
}) {
  const { iframeRef, src, status, error, paused } = frame

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => onNarrowChange(entry.contentRect.width < NARROW_WIDTH))
    observer.observe(element)
    return () => observer.disconnect()
  }, [stageRef, onNarrowChange])

  const busy = status === "loading" || status === "booting"

  return (
    <div
      ref={stageRef}
      data-status={status}
      className="relative isolate min-h-0 flex-1 overflow-hidden rounded-2xl border bg-background max-lg:h-[min(62vh,560px)] max-lg:min-h-80 max-lg:flex-none [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
    >
      <iframe
        ref={iframeRef}
        src={src}
        title="Background preview"
        allow="fullscreen"
        className="absolute inset-0 block h-full w-full border-0 bg-transparent"
      />
      <ContentOverlay view={view} />
      <div
        aria-hidden={!busy}
        className={cn(
          "pointer-events-none absolute inset-0 z-6 grid place-items-center transition-opacity duration-300",
          busy ? "opacity-100 delay-150" : "opacity-0",
        )}
      >
        <Spinner />
      </div>
      {status === "error" ? (
        <div
          role="alert"
          className="absolute inset-0 z-6 flex flex-col items-center justify-center gap-2 bg-background/60 p-6 text-center text-sm text-muted-foreground backdrop-blur-sm"
        >
          <p>This background could not start here.</p>
          {error?.message ? <p className="max-w-[46ch] text-xs text-muted-foreground/70">{error.message}</p> : null}
          <button type="button" className={cn(toolClass, "mt-1.5")} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : null}
      {paused && status !== "error" ? (
        <span className="pointer-events-none absolute bottom-3.5 left-3.5 z-6 inline-flex h-6.5 items-center rounded-lg border bg-background/80 px-2.5 text-xs font-medium text-muted-foreground backdrop-blur">
          Paused
        </span>
      ) : null}
    </div>
  )
}
