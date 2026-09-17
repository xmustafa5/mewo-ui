"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Scopes the indicator's Motion `layoutId` to one `<Tabs>` instance so two unrelated
 * `<Tabs>` roots on the same page don't share a projection node. Internal only.
 */
const TabsIndicatorIdContext = React.createContext<string | undefined>(undefined)

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  const id = React.useId()
  return (
    <TabsIndicatorIdContext.Provider value={id}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
        {...props}
      />
    </TabsIndicatorIdContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * The sliding highlight. Rendered only inside the active tab; Motion's shared-layout
 * engine animates it between tabs as `layoutId` moves. Purely decorative.
 */
function TabsIndicator() {
  const reduceMotion = useReducedMotion()
  const tabsId = React.useContext(TabsIndicatorIdContext)
  const layoutId = tabsId ? `mewo-tab-indicator-${tabsId}` : "mewo-tab-indicator"
  return (
    <motion.span
      layoutId={layoutId}
      data-layout-id={layoutId}
      data-slot="tabs-indicator"
      aria-hidden="true"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "pointer-events-none absolute z-0 rounded-md bg-background shadow-sm",
        // The dark treatment belongs to the pill of the `default` variant only. Left unscoped it
        // also hit the `line` variant's underline and, being emitted later at equal specificity,
        // beat `bg-foreground` — turning a 2px near-white rule into ~4.5% white in dark theme.
        "group-data-[variant=default]/tabs-list:inset-0 group-data-[variant=default]/tabs-list:dark:bg-input/30",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:shadow-none",
        "group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:inset-x-0 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:bottom-[-5px] group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:h-0.5",
        "group-data-[variant=line]/tabs-list:group-data-vertical/tabs:inset-y-0 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:-right-1 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:w-0.5"
      )}
    />
  )
}

/**
 * `children` is read off the render callback's props rather than destructured out of the
 * component's own props. Destructuring it would strip it before Base UI ever saw it, so a
 * consumer's own `render` — `<TabsTrigger render={<Link/>}>`, the routed-tabs pattern, which
 * overrides ours because `{...props}` is spread last — would render an empty element. This way
 * a consumer `render` keeps its children and only loses the decorative indicator.
 */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground data-active:text-foreground dark:data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      render={({ children, ...renderProps }, state) => (
        <button type="button" {...renderProps}>
          {state.active ? <TabsIndicator /> : null}
          <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
        </button>
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
