"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

type GlassPanelContextValue = {
  triggerRef: React.RefObject<HTMLElement | null>
  /** The root's own element: the panel renders into it, beside its trigger. */
  container: HTMLElement | null
  /** Whether focus goes back to the trigger when the panel closes. */
  returnFocusRef: React.RefObject<boolean>
}

const GlassPanelContext = React.createContext<GlassPanelContextValue | null>(null)

function useGlassPanel() {
  const context = React.useContext(GlassPanelContext)
  if (!context) throw new Error("GlassPanel parts must be used inside <GlassPanel>")
  return context
}

// The panel's opening runs on a registered number, 0 closed to 1 open, and its clip is worked out from it on every
// frame. A transition of clip-path itself can be handed to the compositor, which inside a rounded, overflow-clipped
// box (a demo's frame) draws nothing until it ends, so the panel just appears.
if (typeof CSS !== "undefined" && "registerProperty" in CSS) {
  try {
    CSS.registerProperty({ name: "--glass-panel-reveal", syntax: "<number>", inherits: false, initialValue: "1" })
  } catch {}
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

/**
 * A non-modal Base UI dialog: Escape, a press outside or focus leaving closes it. Focus goes back to the trigger
 * only when the panel closed itself (Escape, its close button, its trigger), not when the page closed it to open
 * another panel. Its element takes no space (display: contents) and holds the panel, so a transformed frame that
 * holds the trigger holds the panel too.
 */
function GlassPanel({
  className,
  onOpenChange,
  ...props
}: Omit<DialogPrimitive.Root.Props, "modal"> & { className?: string }) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement>(null)
  const returnFocusRef = React.useRef(false)
  const value = React.useMemo(() => ({ triggerRef, container, returnFocusRef }), [container])
  return (
    <GlassPanelContext.Provider value={value}>
      <div ref={setContainer} data-slot="glass-panel" className={cn("[--story-u:min(2.6667cqw,12px)] min-[901px]:[--story-u:0.625cqw] min-[901px]:@max-[900px]:[--story-u:min(2.6667cqw,12px)] text-[length:var(--story-u)]", "contents", className)}>
        <DialogPrimitive.Root
          modal={false}
          onOpenChange={(open, details) => {
            returnFocusRef.current = !open && details.reason !== "outside-press" && details.reason !== "focus-out"
            onOpenChange?.(open, details)
          }}
          {...props}
        />
      </div>
    </GlassPanelContext.Provider>
  )
}

function GlassPanelTrigger({ className, ref, ...props }: DialogPrimitive.Trigger.Props & React.RefAttributes<HTMLElement>) {
  const { triggerRef } = useGlassPanel()
  return (
    <DialogPrimitive.Trigger
      ref={(el: HTMLElement | null) => {
        triggerRef.current = el
        setRef(ref, el)
      }}
      data-slot="glass-panel-trigger"
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}

/**
 * The panel: glass, at the top inline-end corner (across the screen on phones). It grows out of its trigger: closed,
 * its clip is the trigger's box, measured when it opens, so it starts from wherever the trigger sits. Its children
 * drop into place in turn while it opens. Opened from its trigger, it takes focus: the child marked data-autofocus,
 * else the first control (the close button). Opened without one (defaultOpen, or by the page), it leaves focus where
 * it is, so a page never scrolls to a panel open on load.
 */
function GlassPanelContent({
  className,
  children,
  container,
  showCloseButton = true,
  closeLabel = "Close",
  ref,
  ...props
}: DialogPrimitive.Popup.Props &
  React.RefAttributes<HTMLDivElement> & {
    /** Where the panel renders. Defaults to beside its trigger; pass document.body to lift it out of a clipping parent. */
    container?: DialogPrimitive.Portal.Props["container"]
    showCloseButton?: boolean
    /** The close button's accessible name, in the page's language. */
    closeLabel?: string
  }) {
  const context = useGlassPanel()
  const popupRef = React.useRef<HTMLDivElement>(null)
  const stopMeasuringRef = React.useRef<() => void>(undefined)

  const attach = React.useCallback(
    (el: HTMLDivElement | null) => {
      setRef(ref, el)
      if (el === popupRef.current) return
      popupRef.current = el
      stopMeasuringRef.current?.()
      stopMeasuringRef.current = undefined
      if (!el) return
      const measure = () => {
        const trigger = context.triggerRef.current
        if (!trigger) return
        const a = trigger.getBoundingClientRect()
        const b = el.getBoundingClientRect()
        // the trigger's box inside the panel: the clip when closed
        el.style.setProperty("--glass-panel-t", `${a.top - b.top}px`)
        el.style.setProperty("--glass-panel-r", `${b.right - a.right}px`)
        el.style.setProperty("--glass-panel-b", `${b.bottom - a.bottom}px`)
        el.style.setProperty("--glass-panel-l", `${a.left - b.left}px`)
        el.style.setProperty("--glass-panel-round", getComputedStyle(trigger).borderTopLeftRadius)
      }
      measure()
      window.addEventListener("resize", measure)
      stopMeasuringRef.current = () => window.removeEventListener("resize", measure)
    },
    [context.triggerRef, ref]
  )

  return (
    <DialogPrimitive.Portal container={container === undefined ? context.container : container}>
      <DialogPrimitive.Popup
        ref={attach}
        data-slot="glass-panel-content"
        initialFocus={(openType) => !!openType && (popupRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? true)}
        finalFocus={() => context.returnFocusRef.current}
        className={cn(
          "fixed top-[calc(var(--story-u)*2)] end-[calc(var(--story-u)*2)] z-[110] grid w-[calc(var(--story-u)*50.8)] content-start gap-[calc(var(--story-u)*2)] rounded-lg px-[calc(var(--story-u)*4)] pt-[calc(var(--story-u)*4)] pb-[calc(var(--story-u)*3.6)] outline-none",
          "max-[900px]:top-[calc(var(--story-u)*1.5)] max-[900px]:start-[calc(var(--story-u)*1.5)] max-[900px]:end-[calc(var(--story-u)*1.5)] max-[900px]:w-auto",
          "bg-[rgba(186,186,186,0.2)] backdrop-blur-[12px]",
          // the clip goes from the trigger's box (reveal 0, as it mounts and as it leaves) to the whole panel (reveal 1)
          "[clip-path:inset(calc(var(--glass-panel-t,0px)*(1-var(--glass-panel-reveal)))_calc(var(--glass-panel-r,0px)*(1-var(--glass-panel-reveal)))_calc(var(--glass-panel-b,100%)*(1-var(--glass-panel-reveal)))_calc(var(--glass-panel-l,100%)*(1-var(--glass-panel-reveal)))_round_calc(var(--glass-panel-round,0px)+(calc(var(--story-u)*1.2)-var(--glass-panel-round,0px))*var(--glass-panel-reveal)))]",
          "[--glass-panel-reveal:1] [transition:--glass-panel-reveal_0.8s_cubic-bezier(0.455,0.03,0.515,0.955)]",
          "data-starting-style:[--glass-panel-reveal:0] data-ending-style:[--glass-panel-reveal:0]",
          // the children (not the close button) drop in from above, 50ms apart, and leave together
          "[&>:not([data-slot=glass-panel-close])]:[transition:opacity_0.5s_ease,translate_0.6s_cubic-bezier(0.215,0.61,0.355,1)]",
          "data-starting-style:[&>:not([data-slot=glass-panel-close])]:-translate-y-[calc(var(--story-u)*4)] data-starting-style:[&>:not([data-slot=glass-panel-close])]:opacity-0",
          "data-ending-style:[&>:not([data-slot=glass-panel-close])]:-translate-y-[calc(var(--story-u)*4)] data-ending-style:[&>:not([data-slot=glass-panel-close])]:opacity-0",
          "data-open:[&>:nth-child(3)]:delay-50 data-open:[&>:nth-child(4)]:delay-100 data-open:[&>:nth-child(5)]:delay-150 data-open:[&>:nth-child(n+6)]:delay-200",
          // as specific as the children's own transition, so reduced motion wins over it
          "motion-reduce:transition-none motion-reduce:[&>:not([data-slot=glass-panel-close])]:transition-none",
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <GlassPanelClose className="absolute top-[calc(var(--story-u)*2.2)] end-[calc(var(--story-u)*2.2)] size-[calc(var(--story-u)*1)]">
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="sr-only">{closeLabel}</span>
          </GlassPanelClose>
        )}
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function GlassPanelTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="glass-panel-title"
      className={cn("text-[length:max(11px,calc(var(--story-u)*1.4))] font-medium tracking-[-0.01em] max-[900px]:text-[length:calc(var(--story-u)*1.4)]", className)}
      {...props}
    />
  )
}

function GlassPanelFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return <footer data-slot="glass-panel-footer" className={cn("grid gap-[calc(var(--story-u)*1)] pt-[calc(var(--story-u)*1.6)]", className)} {...props} />
}

function GlassPanelClose({ className, ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="glass-panel-close" className={cn("cursor-pointer", className)} {...props} />
}

export { GlassPanel, GlassPanelTrigger, GlassPanelContent, GlassPanelTitle, GlassPanelFooter, GlassPanelClose }
