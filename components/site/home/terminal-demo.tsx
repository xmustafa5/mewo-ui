"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"

export type TerminalRun = { name: string; dependencies: string[] }

function outputFor(run: TerminalRun) {
  return [
    "✔ Checking registry.",
    run.dependencies.length > 0 ? `✔ Installing ${run.dependencies.join(", ")}.` : "✔ No dependencies to install.",
    "✔ Created 1 file:",
    `  - components/ui/${run.name}.tsx`,
  ]
}

const commandFor = (run: TerminalRun) => `npx shadcn@latest add @mewo/${run.name}`

/**
 * Types an install command, prints the CLI's output, then moves on to the next item. It holds while the
 * terminal is off screen or the tab is hidden: typing no one sees would still re-render and repaint the
 * window on every keystroke, wherever the reader is on the page.
 */
export function TerminalDemo({ runs }: { runs: TerminalRun[] }) {
  const reduceMotion = useReducedMotion()
  const [frame, setFrame] = React.useState({ index: 0, typed: 0, lines: 0 })
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (reduceMotion || runs.length === 0) return
    let cancelled = false
    const timers: number[] = []

    // the next step waits until the terminal can be seen
    let onScreen = true
    let resume: (() => void) | null = null
    const canBeSeen = () => onScreen && !document.hidden
    const wake = () => {
      if (!canBeSeen() && !cancelled) return
      resume?.()
      resume = null
    }
    const element = root.current
    const observer =
      element && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting
              wake()
            },
            { rootMargin: "100px" },
          )
        : null
    if (element) observer?.observe(element)
    document.addEventListener("visibilitychange", wake)
    const seen = () => (canBeSeen() ? Promise.resolve() : new Promise<void>((resolve) => (resume = resolve)))
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms))).then(seen)

    async function play() {
      let index = 0
      while (!cancelled) {
        const run = runs[index]
        const command = commandFor(run)
        await wait(500)
        for (let typed = 1; typed <= command.length && !cancelled; typed++) {
          setFrame({ index, typed, lines: 0 })
          await wait(26)
        }
        const output = outputFor(run)
        for (let lines = 1; lines <= output.length && !cancelled; lines++) {
          await wait(lines === 1 ? 380 : 240)
          if (!cancelled) setFrame({ index, typed: command.length, lines })
        }
        await wait(2600)
        index = (index + 1) % runs.length
      }
    }

    play()
    return () => {
      cancelled = true
      timers.forEach(window.clearTimeout)
      observer?.disconnect()
      document.removeEventListener("visibilitychange", wake)
      wake()
    }
  }, [reduceMotion, runs])

  const run = runs[reduceMotion ? 0 : frame.index]
  if (!run) return null
  const command = commandFor(run)
  const typed = reduceMotion ? command.length : frame.typed
  const lines = reduceMotion ? outputFor(run).length : frame.lines
  const typing = typed < command.length

  return (
    <div ref={root} className="space-y-1 p-4 font-mono text-[13px] leading-6" aria-label={`Terminal: ${command}`} role="img">
      <p className="whitespace-pre">
        <span className="text-brand-text">$ </span>
        {command.slice(0, typed)}
        {typing || lines === 0 ? (
          <span aria-hidden className="ml-px inline-block h-4 w-2 translate-y-0.5 bg-foreground/70 motion-safe:animate-[mewo-caret_1s_steps(1)_infinite]" />
        ) : null}
      </p>
      {outputFor(run)
        .slice(0, lines)
        .map((line) => (
          <p key={line} className="whitespace-pre text-muted-foreground">
            {line.startsWith("✔") ? (
              <>
                <span className="text-brand-text">✔</span>
                {line.slice(1)}
              </>
            ) : (
              line
            )}
          </p>
        ))}
    </div>
  )
}
