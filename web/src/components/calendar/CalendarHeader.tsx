"use client"

import React from "react"
import { useCalendar } from "./ActivityCalendar"

export function CalendarHeader() {
  const { currentDate } = useCalendar()
  
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long" })
  const year = currentDate.getFullYear()

  return (
    <div className="flex items-center justify-between py-0 mt-1">
      <h2 className="text-lg font-bold tracking-tight text-foreground/90">
        {monthName} <span className="font-normal text-muted-foreground">{year}</span>
      </h2>
    </div>
  )
}
