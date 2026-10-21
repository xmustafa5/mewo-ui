import { useSyncExternalStore } from "react"

const subscribe = (query: string) => (listener: () => void) => {
  const list = window.matchMedia(query)
  list.addEventListener("change", listener)
  return () => list.removeEventListener("change", listener)
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}
