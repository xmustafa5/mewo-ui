import * as React from "react"

/** How far a touch travels before it is read as a scrub or a scroll. */
const INTENT_PX = 6

/**
 * Pointer handling for a control you can scrub anywhere on. A mouse takes the gesture on press. A touch cannot:
 * the panel is wall-to-wall rows, so a row that took every touch would leave no way to scroll past it. A touch
 * is left alone until it moves sideways; a vertical move stays the page's (the row's `touch-action: pan-y`
 * hands it back), and a lift without a move is a tap that sets the value where it landed.
 */
export function useScrub({
  trackRef,
  computeValue,
  onChange,
  disabled,
}: {
  trackRef: React.RefObject<HTMLElement | null>
  computeValue: (clientX: number) => number
  onChange?: (value: number) => void
  disabled?: boolean
}) {
  const [dragging, setDragging] = React.useState(false)
  // mirrors `dragging` so a move landing in the same tick as the state update is not dropped
  const draggingRef = React.useRef(false)
  const pendingRef = React.useRef<{ id: number; x: number; y: number } | null>(null)

  const begin = React.useCallback(
    (event: React.PointerEvent) => {
      draggingRef.current = true
      setDragging(true)
      trackRef.current?.setPointerCapture?.(event.pointerId)
      onChange?.(computeValue(event.clientX))
    },
    [trackRef, computeValue, onChange],
  )

  const end = React.useCallback(() => {
    draggingRef.current = false
    pendingRef.current = null
    setDragging(false)
  }, [])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return
      if (event.pointerType === "touch") {
        pendingRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        return
      }
      event.preventDefault()
      begin(event)
    },
    [disabled, begin],
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent) => {
      const pending = pendingRef.current
      if (pending) {
        if (event.pointerId !== pending.id) return
        const dx = event.clientX - pending.x
        const dy = event.clientY - pending.y
        if (Math.abs(dx) < INTENT_PX && Math.abs(dy) < INTENT_PX) return
        pendingRef.current = null
        // vertical intent is the page's, and the pointer was never claimed, so the browser already scrolls with it
        if (Math.abs(dy) >= Math.abs(dx)) return
        begin(event)
        return
      }
      if (!draggingRef.current) return
      onChange?.(computeValue(event.clientX))
    },
    [begin, computeValue, onChange],
  )

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent) => {
      if (pendingRef.current?.id === event.pointerId) onChange?.(computeValue(event.clientX))
      end()
    },
    [computeValue, onChange, end],
  )

  const onPointerCancel = React.useCallback(() => end(), [end])

  return { dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
