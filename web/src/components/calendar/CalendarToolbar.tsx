"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCalendar } from "./ActivityCalendar"
import { CalendarDayPicker } from "./CalendarDayPicker"
import { CalendarWeekPicker } from "./CalendarWeekPicker"
import { CalendarMonthPicker } from "./CalendarMonthPicker"
import { CalendarYearPicker } from "./CalendarYearPicker"

export function CalendarToolbar() {
  const { currentDate, setCurrentDate, mode } = useCalendar()

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-2 pb-0">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={goToToday} className="h-6 px-2 text-[10px] rounded-md shadow-sm border-border/60">
          Today
        </Button>
        <div className="flex items-center border border-border/60 rounded-md shadow-sm bg-background">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none border-r border-border/60" onClick={prevMonth}>
            <ChevronLeft size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={nextMonth}>
            <ChevronRight size={12} />
          </Button>
        </div>
      </div>

      <div className="flex items-center p-1 bg-muted/40 rounded-lg shadow-sm border border-border/40">
        {mode !== "attendance" && <CalendarWeekPicker />}
        <CalendarMonthPicker />
        <CalendarYearPicker />
      </div>
      
      {/* Empty div to balance flex-between if needed, or place something else on the right */}
      <div className="hidden md:block w-24"></div>
    </div>
  )
}
