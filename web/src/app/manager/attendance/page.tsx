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
import { ActivityCalendar } from "@/components/calendar/ActivityCalendar"

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

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: attendanceData, loading, error, refresh } = useAttendance({ startDate: monthStart, endDate: monthEnd })
  const { data: usersData } = useUsers()

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const allEmployees = useMemo(() => (usersData ?? []).filter((u) => u.role === "EMPLOYEE"), [usersData])

  const attendanceMap = useMemo(() => {
    const map = new Map<string, typeof attendanceData>()
    for (const record of attendanceData ?? []) {
      const d = new Date(record.date)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const existing = map.get(dateKey) ?? []
      existing.push(record)
      map.set(dateKey, existing)
    }
    return map
  }, [attendanceData])

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
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



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PageHeader title="Attendance" subtitle="Team attendance calendar and daily overview" />
        <Button variant="outline" onClick={refresh} disabled={loading} className="shrink-0 shadow-sm border-border/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`mr-2 ${loading ? 'animate-spin' : ''}`}
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Refresh Data
        </Button>
      </div>

      {/* Top Layout: Calendar & Metrics */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Calendar Component */}
        <div className="flex-none">
          <ActivityCalendar 
            mode="attendance" 
            attendance={attendanceData ?? []} 
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Summary Cards */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <Card className="flex flex-col justify-center">
            <CardHeader className="pb-2"><CardTitle className="text-caption text-muted-foreground">Total Employees</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalEmployees}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-center">
            <CardHeader className="pb-2"><CardTitle className="text-caption text-muted-foreground">Present</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-emerald-600">{presentCount}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-center">
            <CardHeader className="pb-2"><CardTitle className="text-caption text-muted-foreground">Absent</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-red-500">{absentCount}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-center">
            <CardHeader className="pb-2"><CardTitle className="text-caption text-muted-foreground">Attendance %</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{attendancePercent}%</p>
            </CardContent>
          </Card>
        </div>
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
