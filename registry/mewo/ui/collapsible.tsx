"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn(className)}
      {...props}
    />
  )
}

function CollapsibleTrigger({ className, ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(className)}
      {...props}
    />
  )
}

/**
 * `children` is read off the render callback's props rather than destructured out of the
 * component's own props. Destructuring it would strip it before Base UI ever saw it, so a
 * consumer's own `render` — `<CollapsibleContent render={<section/>}>`, which overrides ours
 * because `{...props}` is spread last — would render an empty element.
 */
function CollapsibleContent({ className, ...props }: CollapsiblePrimitive.Panel.Props) {
  const reduceMotion = useReducedMotion()
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out data-ending-style:h-0 data-starting-style:h-0",
        className
      )}
      render={({ children, ...renderProps }, state) => (
        <div {...renderProps}>
          <motion.div
            initial={false}
            animate={{ opacity: state.open ? 1 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
