"use client"

import React, { createContext, useContext, useState } from "react"
import { CalendarHeader } from "./CalendarHeader"
import { CalendarGrid } from "./CalendarGrid"
import { CalendarToolbar } from "./CalendarToolbar"
import { CalendarLegend } from "./CalendarLegend"
import { Card } from "@/components/ui/card"

export const CalendarContext = createContext<any>(null)
export const useCalendar = () => useContext(CalendarContext)

export interface ActivityCalendarProps {
  mode: "employee" | "attendance"
  attendance: any[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
}

export function ActivityCalendar({ mode, attendance, selectedDate, onDateSelect }: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  
  const value = {
    mode,
    attendance,
    selectedDate,
    onDateSelect,
    currentDate,
    setCurrentDate
  }

  return (
    <CalendarContext.Provider value={value}>
      <Card className="shadow-sm border-border/40 overflow-hidden bg-white dark:bg-card rounded-xl w-full max-w-[380px]">
        <div className="p-1 md:p-2 pb-0 border-b bg-white dark:bg-card">
          <CalendarToolbar />
          <CalendarHeader />
        </div>
        <div className="p-1 md:p-2 bg-white dark:bg-card">
          <CalendarGrid />
          <div className="mt-1 pt-1 border-t border-border/40">
            <CalendarLegend />
          </div>
        </div>
      </Card>
    </CalendarContext.Provider>
  )
}
