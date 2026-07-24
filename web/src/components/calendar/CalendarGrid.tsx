"use client"

import React, { useMemo } from "react"
import { useCalendar } from "./ActivityCalendar"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarGrid() {
  const { mode, attendance, currentDate, selectedDate, onDateSelect } = useCalendar()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []
    
    // Previous month padding
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ day: d.getDate(), date: d, dateKey, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ day: i, date: d, dateKey, isCurrentMonth: true })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ day: d.getDate(), date: d, dateKey, isCurrentMonth: false })
    }

    return days
  }, [year, month])

  const attendanceMap = useMemo(() => {
    const map = new Map<string, any[]>()
    if (mode === "attendance") {
      for (const record of attendance ?? []) {
        if (!record.date) continue
        const d = new Date(record.date)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const existing = map.get(dateKey) ?? []
        existing.push(record)
        map.set(dateKey, existing)
      }
    }
    return map
  }, [attendance, mode])

  const getIndicatorStatus = (dateKey: string, d: Date) => {
    if (mode === "employee") {
      const record = attendance?.find((a: any) => a.date && a.date.startsWith(dateKey))
      return record?.status
    }
    
    // Attendance mode (team aggregation)
    const records = attendanceMap.get(dateKey)
    if (!records || records.length === 0) {
      const dayOfWeek = d.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) return "weekend"
      return null
    }
    
    const presentCount = records.filter((r) => r.checkInAt).length
    const totalCount = records.length
    
    if (presentCount === totalCount) return "present"
    if (presentCount >= totalCount / 2) return "half-day"
    return "absent"
  }

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const selectedKey = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : null

  return (
    <div className="w-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-border/40 rounded-xl overflow-hidden border border-border/40 shadow-sm">
        {calendarDays.map((day, idx) => {
          const isToday = day.dateKey === todayKey
          const isSelected = day.dateKey === selectedKey
          const status = getIndicatorStatus(day.dateKey, day.date)

          let indicatorNode = null
          if (status === "present") indicatorNode = <span className="size-1 rounded-full bg-emerald-500 shadow-sm" />
          else if (status === "absent") indicatorNode = <span className="size-1 rounded-full bg-red-500 shadow-sm" />
          else if (status === "half-day") indicatorNode = <span className="size-1 rounded-full bg-amber-500 shadow-sm" />
          else if (status === "weekend") indicatorNode = <span className="size-1 rounded-full bg-muted-foreground/30 shadow-sm" />
          else if (status === "future") indicatorNode = <span className="size-1 rounded-full bg-transparent" />

          return (
            <button
              key={`${day.dateKey}-${idx}`}
              onClick={() => onDateSelect(day.date)}
              className={`
                group relative flex flex-col aspect-square w-full p-0.5 transition-all outline-none rounded-xl
                ${day.isCurrentMonth ? "bg-card hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/20"}
                ${isSelected ? "bg-accent/5 z-10" : ""}
              `}
            >
              <div className="absolute top-1 right-1.5 flex items-center justify-center">
                <div className={`
                  flex items-center justify-center min-w-[20px] h-[20px] rounded-[4px]
                  ${isSelected ? "bg-primary text-primary-foreground shadow-sm z-10" : ""}
                `}>
                  <span className={`
                    text-[10px] md:text-xs font-medium z-10
                    ${isSelected ? "text-primary-foreground font-semibold" : ""}
                    ${isToday && !isSelected ? "text-muted-foreground bg-muted/40 rounded px-1" : ""}
                    ${!isToday && !isSelected ? (!day.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground/90") : ""}
                  `}>
                    {day.day}
                  </span>
                </div>
              </div>

              {/* Indicator */}
              <div className="mt-auto mx-auto mb-1 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-200">
                {indicatorNode}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
