"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface ExpandableSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  badge?: string | number
}

export function ExpandableSection({ title, children, defaultOpen = false, badge }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
          <span className="text-body-sm font-medium">{title}</span>
        </div>
        {badge !== undefined && (
          <span className="text-caption text-muted-foreground">{badge}</span>
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
