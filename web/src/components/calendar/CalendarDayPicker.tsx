"use client"

import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCalendar } from "./ActivityCalendar"

export function CalendarDayPicker() {
  const { currentDate, setCurrentDate } = useCalendar()
  const [open, setOpen] = useState(false)

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const handleSelect = (day: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(day)
    setCurrentDate(newDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          Day
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 border-border/40 shadow-xl rounded-xl">
        <ScrollArea className="h-64">
          <div className="grid grid-cols-4 gap-1 p-2">
            {days.map((d) => (
              <Button 
                key={d} 
                variant="ghost" 
                className={`h-8 w-8 p-0 rounded-md text-sm ${currentDate.getDate() === d ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => handleSelect(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
