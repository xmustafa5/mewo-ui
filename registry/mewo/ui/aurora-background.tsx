"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface AuroraBackgroundProps extends React.ComponentProps<"div"> {
  /** Fade the aurora out towards the bottom-left so content stays readable. */
  showRadialMask?: boolean
}

export function AuroraBackground({ children, showRadialMask = true, className, ...props }: AuroraBackgroundProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      data-slot="aurora-background"
      className={cn("relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden bg-background", className)}
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -inset-[10%] opacity-50 blur-[40px] will-change-transform",
            "bg-[length:300%_200%] bg-[linear-gradient(100deg,#3b82f6_10%,#a5b4fc_20%,#93c5fd_30%,#ddd6fe_40%,#60a5fa_50%,#3b82f6_60%)]",
            "motion-safe:animate-[mewo-aurora_60s_linear_infinite]",
            showRadialMask && "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"
          )}
        />
      </div>
      <motion.div
        className="relative z-10 flex w-full flex-col items-center"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
