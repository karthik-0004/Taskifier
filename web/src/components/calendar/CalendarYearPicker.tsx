"use client"

import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCalendar } from "./ActivityCalendar"

export function CalendarYearPicker() {
  const { currentDate, setCurrentDate } = useCalendar()
  const [open, setOpen] = useState(false)

  // Generate years from 2020 to 2030
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  const handleSelect = (year: number) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(year)
    setCurrentDate(newDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          Year
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-0 border-border/40 shadow-xl rounded-xl">
        <ScrollArea className="h-48">
          <div className="flex flex-col gap-1 p-2">
            {years.map((y) => (
              <Button 
                key={y} 
                variant="ghost" 
                className={`text-sm ${currentDate.getFullYear() === y ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => handleSelect(y)}
              >
                {y}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
