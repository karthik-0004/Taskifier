"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useAttendance, useUsers } from "@/lib/api-hooks"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatHours(ms: number): string {
  if (ms <= 0) return "—"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function ManagerAttendancePage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [yearInput, setYearInput] = useState(currentDate.getFullYear().toString())
  const [showYearPicker, setShowYearPicker] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthStart = new Date(year, month, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const { data: attendanceData, loading, error } = useAttendance({ startDate: monthStart, endDate: monthEnd })
  const { data: usersData } = useUsers()

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const allEmployees = useMemo(() => (usersData ?? []).filter((u) => u.role === "EMPLOYEE"), [usersData])

  const attendanceMap = useMemo(() => {
    const map = new Map<string, typeof attendanceData>()
    for (const record of attendanceData ?? []) {
      const dateKey = record.date.slice(0, 10)
      const existing = map.get(dateKey) ?? []
      existing.push(record)
      map.set(dateKey, existing)
    }
    return map
  }, [attendanceData])

  const selectedKey = selectedDate.toISOString().slice(0, 10)
  const selectedAttendance = attendanceMap.get(selectedKey) ?? []

  const presentEmployees = useMemo(() => {
    return selectedAttendance.filter((a) => a.checkInAt)
  }, [selectedAttendance])

  const presentUserIds = new Set(presentEmployees.map((a) => a.userId))
  const absentEmployees = useMemo(() => {
    return allEmployees.filter((e) => !presentUserIds.has(e.id))
  }, [allEmployees, presentUserIds])

  const totalEmployees = allEmployees.length
  const presentCount = presentEmployees.length
  const absentCount = absentEmployees.length
  const attendancePercent = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0

  // Calendar generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: Array<{ day: number; date: Date; dateKey: string; isToday: boolean; isCurrentMonth: boolean }> = []

    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1)
      days.push({ day: d.getDate(), date: d, dateKey: d.toISOString().slice(0, 10), isToday: false, isCurrentMonth: false })
    }

    const todayKey = new Date().toISOString().slice(0, 10)

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateKey = d.toISOString().slice(0, 10)
      days.push({ day: i, date: d, dateKey, isToday: dateKey === todayKey, isCurrentMonth: true })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ day: d.getDate(), date: d, dateKey: d.toISOString().slice(0, 10), isToday: false, isCurrentMonth: false })
    }

    return days
  }, [year, month])

  function getDateIndicator(dateKey: string): "green" | "yellow" | "red" | null {
    const records = attendanceMap.get(dateKey)
    if (!records) return null
    const present = records.filter((r) => r.checkInAt).length
    const employeesOnDate = records.length
    if (employeesOnDate === 0) return null
    if (present === employeesOnDate) return "green"
    if (present >= employeesOnDate / 2) return "yellow"
    return "red"
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setYearInput((month - 1 < 0 ? year - 1 : year).toString())
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setYearInput((month + 1 > 11 ? year + 1 : year).toString())
  }

  function goToYear() {
    const y = parseInt(yearInput)
    if (!isNaN(y) && y >= 1900 && y <= 2100) {
      setCurrentDate(new Date(y, month, 1))
    }
    setShowYearPicker(false)
  }

  function goToToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
    setYearInput(today.getFullYear().toString())
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Team attendance calendar and daily overview" />

      {/* Calendar Card */}
      <Card>
        <CardContent className="p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-h3 whitespace-nowrap">{MONTHS[month]} {year}</h2>
                {showYearPicker ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={yearInput}
                      onChange={(e) => setYearInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goToYear()}
                      className="w-20 h-8 rounded-lg border border-input bg-background px-2 text-body-sm text-center"
                      autoFocus
                      min={1900}
                      max={2100}
                    />
                    <Button variant="primary" size="sm" onClick={goToYear}>Go</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowYearPicker(true)}
                    className="text-caption text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CalendarDays size={14} />
                  </button>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={nextMonth}>
                <ChevronRight size={16} />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-caption text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {calendarDays.map((day) => {
              const isSelected = day.dateKey === selectedKey
              const indicator = getDateIndicator(day.dateKey)
              const absentCount = indicator ? (allEmployees.length - (attendanceMap.get(day.dateKey)?.filter((r) => r.checkInAt).length ?? 0)) : 0

              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDate(day.date)}
                  className={`
                    relative flex flex-col items-center justify-center py-2.5 px-1 transition-colors min-h-[52px]
                    ${!day.isCurrentMonth ? "bg-muted/30" : "bg-card hover:bg-muted/50"}
                    ${isSelected ? "bg-accent/10 ring-2 ring-accent ring-inset z-10" : ""}
                  `}
                >
                  <span className={`
                    text-body-sm font-medium leading-none
                    ${day.isToday ? "flex items-center justify-center size-7 rounded-full bg-accent text-accent-foreground font-bold" : ""}
                    ${!day.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                    ${isSelected && !day.isToday ? "text-accent font-semibold" : ""}
                  `}>
                    {day.day}
                  </span>
                  {day.isCurrentMonth && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {indicator === "green" && <span className="size-1.5 rounded-full bg-emerald-500" />}
                      {indicator === "yellow" && <span className="size-1.5 rounded-full bg-amber-500" />}
                      {indicator === "red" && <span className="size-1.5 rounded-full bg-red-500" />}
                      {absentCount > 0 && (
                        <span className="text-[10px] leading-none text-muted-foreground/60 ml-0.5">{absentCount}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-caption text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> All present</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Partial</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> High absentee</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-caption text-muted-foreground">Total Employees</CardTitle></CardHeader>
          <CardContent>
            <p className="text-h2 font-semibold">{totalEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-caption text-muted-foreground">Present</CardTitle></CardHeader>
          <CardContent>
            <p className="text-h2 font-semibold text-emerald-600">{presentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-caption text-muted-foreground">Absent</CardTitle></CardHeader>
          <CardContent>
            <p className="text-h2 font-semibold text-red-500">{absentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-caption text-muted-foreground">Attendance %</CardTitle></CardHeader>
          <CardContent>
            <p className="text-h2 font-semibold">{attendancePercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Date label */}
      <div className="flex items-center gap-2">
        <h2 className="text-h3">
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </h2>
      </div>

      {loading ? (
        <Skeleton variant="rectangular" className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Present Employees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Present
                <Badge variant="success">{presentCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {presentEmployees.length === 0 ? (
                <div className="px-5 pb-5 text-body-sm text-muted-foreground">No employees were present on this date.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b text-caption text-muted-foreground">
                        <th className="text-left px-4 py-2.5 font-medium">ID</th>
                        <th className="text-left px-4 py-2.5 font-medium">Name</th>
                        <th className="text-left px-4 py-2.5 font-medium">Check-In</th>
                        <th className="text-left px-4 py-2.5 font-medium">Check-Out</th>
                        <th className="text-left px-4 py-2.5 font-medium">Hours</th>
                        <th className="text-left px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presentEmployees.map((a) => {
                        const checkIn = a.checkInAt ? new Date(a.checkInAt).getTime() : 0
                        const checkOut = a.checkOutAt ? new Date(a.checkOutAt).getTime() : Date.now()
                        const hours = formatHours(checkOut - checkIn)
                        return (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-caption text-muted-foreground">{a.userId.slice(0, 8)}</td>
                            <td className="px-4 py-2.5 font-medium">{a.user.name}</td>
                            <td className="px-4 py-2.5">{formatTime(a.checkInAt)}</td>
                            <td className="px-4 py-2.5">{formatTime(a.checkOutAt)}</td>
                            <td className="px-4 py-2.5">{hours}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="success">Present</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Absent Employees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Absent
                <Badge variant="danger">{absentCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {absentEmployees.length === 0 ? (
                <div className="px-5 pb-5 text-body-sm text-muted-foreground">All employees were present on this date.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b text-caption text-muted-foreground">
                        <th className="text-left px-4 py-2.5 font-medium">ID</th>
                        <th className="text-left px-4 py-2.5 font-medium">Name</th>
                        <th className="text-left px-4 py-2.5 font-medium">Department / Role</th>
                        <th className="text-left px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentEmployees.map((e) => (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-caption text-muted-foreground">{e.id.slice(0, 8)}</td>
                          <td className="px-4 py-2.5 font-medium">{e.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{e.position ?? "—"}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="danger">Absent</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
