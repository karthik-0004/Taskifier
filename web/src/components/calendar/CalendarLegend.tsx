"use client"

import React from "react"
import { useCalendar } from "./ActivityCalendar"

export function CalendarLegend() {
  const { mode } = useCalendar()
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground font-medium pb-1">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500 shadow-sm" />
        <span>{mode === "employee" ? "Present" : "All Present"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-amber-500 shadow-sm" />
        <span>{mode === "employee" ? "Half Day" : "Partial Present"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-red-500 shadow-sm" />
        <span>{mode === "employee" ? "Absent" : "High Absentee"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-muted-foreground/30 shadow-sm" />
        <span>Weekend</span>
      </div>
    </div>
  )
}
