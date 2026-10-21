/**
 * A tiny external store for `useSyncExternalStore`. The studio keeps frame status, bridge and clock state here
 * rather than in React state because that state is written from effects, timers and the iframe's own callbacks.
 */
export type Store<T extends object> = {
  get: () => T
  set: (next: Partial<T> | ((previous: T) => Partial<T>)) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set: (next) => {
      const patch = typeof next === "function" ? next(state) : next
      let changed = false
      for (const key of Object.keys(patch) as (keyof T)[]) {
        if (!Object.is(state[key], patch[key])) {
          changed = true
          break
        }
      }
      if (!changed) return
      state = { ...state, ...patch }
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
