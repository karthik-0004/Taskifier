"use client"

import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useCalendar } from "./ActivityCalendar"

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
]

export function CalendarMonthPicker() {
  const { currentDate, setCurrentDate } = useCalendar()
  const [open, setOpen] = useState(false)

  const handleSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(monthIndex)
    setCurrentDate(newDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          Month
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 border-border/40 shadow-xl rounded-xl">
        <div className="grid grid-cols-2 gap-1">
          {MONTHS.map((m, i) => (
            <Button 
              key={m} 
              variant="ghost" 
              className={`justify-start text-xs font-medium px-3 h-8 ${currentDate.getMonth() === i ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => handleSelect(i)}
            >
              {m}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
