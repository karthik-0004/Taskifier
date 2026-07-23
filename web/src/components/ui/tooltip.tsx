"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  children: ReactNode
  className?: string
}

const sideClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

const arrowClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-foreground",
  left: "left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground",
  right: "right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground",
}

export function Tooltip({
  content,
  side = "top",
  children,
  className,
}: TooltipProps) {
  if (!content) return <>{children}</>

  return (
    <div className="relative inline-flex group">
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          sideClasses[side],
          className
        )}
      >
        <div className="rounded-lg bg-foreground px-2.5 py-1.5 text-caption text-background whitespace-nowrap shadow-elevated">
          {content}
        </div>
        <div className={cn("absolute", arrowClasses[side])} />
      </div>
    </div>
  )
}
