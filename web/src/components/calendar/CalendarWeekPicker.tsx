"use client"

import React, { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCalendar } from "./ActivityCalendar"

export function CalendarWeekPicker() {
  const { currentDate, setCurrentDate } = useCalendar()
  const [open, setOpen] = useState(false)

  const weeks = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Find the first Monday
    const start = new Date(firstDay)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)

    const weeksArray = []
    let current = new Date(start)
    
    while (current <= lastDay) {
      const end = new Date(current)
      end.setDate(end.getDate() + 6)
      
      weeksArray.push({
        start: new Date(current),
        end: new Date(end),
        label: `${current.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`
      })
      current.setDate(current.getDate() + 7)
    }
    return weeksArray
  }, [currentDate])

  const handleSelect = (start: Date) => {
    setCurrentDate(new Date(start))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          Week
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 border-border/40 shadow-xl rounded-xl">
        <ScrollArea className="max-h-64">
          <div className="flex flex-col gap-1 p-1">
            {weeks.map((w, i) => (
              <Button 
                key={i} 
                variant="ghost" 
                className="justify-start text-xs font-medium px-2 py-1.5 h-auto text-left"
                onClick={() => handleSelect(w.start)}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
