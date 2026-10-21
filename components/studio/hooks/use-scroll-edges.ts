import { useEffect, useState, type RefObject } from "react"

const EDGE = 2

export type ScrollEdges = { top: boolean; bottom: boolean; below: number }

/** Whether a scroll container sits at its top or bottom, and how many `itemSelector` items are out of view below. */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, itemSelector?: string): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ top: true, bottom: true, below: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let frame = 0

    const measure = () => {
      frame = 0
      const remaining = element.scrollHeight - element.scrollTop - element.clientHeight
      const limit = element.getBoundingClientRect().bottom - 8
      const below = itemSelector
        ? [...element.querySelectorAll(itemSelector)].filter((item) => item.getBoundingClientRect().top > limit).length
        : 0
      const next = { top: element.scrollTop <= EDGE, bottom: remaining <= EDGE, below }
      setEdges((previous) =>
        previous.top === next.top && previous.bottom === next.bottom && previous.below === next.below ? previous : next,
      )
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    schedule()
    element.addEventListener("scroll", schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(element)
    const mutations = new MutationObserver(() => {
      resize.disconnect()
      resize.observe(element)
      for (const child of element.children) resize.observe(child)
      schedule()
    })
    for (const child of element.children) resize.observe(child)
    mutations.observe(element, { childList: true })

    return () => {
      element.removeEventListener("scroll", schedule)
      resize.disconnect()
      mutations.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [ref, itemSelector])

  return edges
}
