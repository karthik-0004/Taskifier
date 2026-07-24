"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { LogIn, LogOut, CheckCircle2, Clock, CalendarDays, TrendingUp, CalendarX, FileText } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { useMyAttendance, useMySummaries, checkIn, checkOut } from "@/lib/api-hooks"
import { ActivityCalendar } from "@/components/calendar/ActivityCalendar"
import {
  Tooltip
} from "@/components/ui/tooltip"

function formatHoursAndMinutes(ms: number): string {
  if (ms <= 0) return "—"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function EmployeeAttendancePage() {
  const { toast } = useToast()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Fetch summaries for the selected day summary display
  const { data: summariesData } = useMySummaries()

  // Note: we fetch all here just so we can calculate monthly stats easily. 
  // In a large app, we might paginate, but this is fine.
  const { data: attendanceData, loading, refresh } = useMyAttendance()

  const handleCheckIn = () => {
    checkIn()
      .then(() => {
        refresh()
        toast("Checked in successfully", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  const handleCheckOut = () => {
    checkOut()
      .then(() => {
        refresh()
        toast("Checked out successfully", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  const isAfter4PM = new Date().getHours() >= 16

  // Process data for the selected date
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
  
  const selectedAttendance = useMemo(() => {
    return (attendanceData || []).find((a: any) => {
      if (!a.date) return false
      const d = new Date(a.date)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return dateKey === selectedKey
    })
  }, [attendanceData, selectedKey])

  const selectedSummary = useMemo(() => {
    return (summariesData || []).find((s: any) => {
      if (!s.date) return false
      const d = new Date(s.date)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return dateKey === selectedKey
    })
  }, [summariesData, selectedKey])

  // Monthly stats calculation
  const monthlyStats = useMemo(() => {
    let present = 0
    let partial = 0
    
    // We only count up to today for absences
    const today = new Date()
    const currentMonthDays = (year === today.getFullYear() && month === today.getMonth()) 
      ? today.getDate() 
      : lastDay

    // Filter to current month
    const thisMonthAttendance = (attendanceData || []).filter((a: any) => {
      if (!a.date) return false
      const d = new Date(a.date)
      return d.getFullYear() === year && d.getMonth() === month
    })

    thisMonthAttendance.forEach((a: any) => {
      if (a.checkInAt && a.checkOutAt) present++
      else if (a.checkInAt) partial++
    })

    // Roughly calculate absent days (weekdays not marked)
    // For simplicity, we just do (elapsed days - present - partial)
    // To be precise we should remove weekends, but this gives a quick metric.
    const absent = Math.max(0, currentMonthDays - present - partial)
    
    const percentage = currentMonthDays > 0 ? Math.round(((present + partial*0.5) / currentMonthDays) * 100) : 100

    return { present, partial, absent, percentage }
  }, [attendanceData, year, month, lastDay])

  const formatTimeLocal = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const calculateHours = (inAt: string | null, outAt: string | null) => {
    if (!inAt) return "—"
    if (!outAt) {
      // If it's today, show running elapsed
      const isToday = selectedKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      if (isToday) {
        return formatHoursAndMinutes(Date.now() - new Date(inAt).getTime())
      }
      return "—"
    }
    return formatHoursAndMinutes(new Date(outAt).getTime() - new Date(inAt).getTime())
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PageHeader title="Attendance" subtitle="Track your attendance, working hours, and history" />
        <Button variant="outline" onClick={refresh} disabled={loading} className="shrink-0 shadow-sm border-border/60">
          <Clock size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Calendar */}
        <div className="flex-none">
          <ActivityCalendar 
            mode="attendance" 
            attendance={attendanceData ?? []} 
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              if (date) setSelectedDate(date)
            }} 
          />
        </div>

        {/* Right: Stats & Today */}
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" /> Monthly Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                <span className="font-semibold">{monthlyStats.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${monthlyStats.percentage}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Present</span>
                  <span className="text-lg font-semibold text-emerald-500">{monthlyStats.present}</span>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Half</span>
                  <span className="text-lg font-semibold text-amber-500">{monthlyStats.partial}</span>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Absent</span>
                  <span className="text-lg font-semibold text-rose-500">{monthlyStats.absent}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </CardTitle>
                <Badge variant={selectedAttendance?.checkOutAt ? "success" : selectedAttendance?.checkInAt ? "warning" : "secondary"}>
                  {selectedAttendance?.checkOutAt ? "Completed" : selectedAttendance?.checkInAt ? "Partial" : "Absent"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Check In</p>
                  <p className="font-semibold">
                    {formatTimeLocal(selectedAttendance?.checkInAt || null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Check Out</p>
                  <p className="font-semibold">
                    {formatTimeLocal(selectedAttendance?.checkOutAt || null)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Hours</p>
                <p className="font-semibold text-primary">
                  {calculateHours(selectedAttendance?.checkInAt || null, selectedAttendance?.checkOutAt || null)}
                </p>
              </div>

              {selectedSummary && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} /> Daily Summary
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {selectedSummary.editedContent || selectedSummary.aiGeneratedContent}
                  </p>
                </div>
              )}

              {/* Action buttons if selected date is today */}
              {selectedKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` && (
                <div className="pt-2 flex gap-2">
                  {!selectedAttendance?.checkInAt ? (
                    <Button className="flex-1 shadow-sm" size="sm" onClick={handleCheckIn}>
                      <LogIn size={14} className="mr-2" /> Check In
                    </Button>
                  ) : !selectedAttendance?.checkOutAt ? (
                    <Tooltip content={!isAfter4PM ? "You can check out after 4:00 PM." : null} side="top">
                      <div className="flex-1 flex">
                        <Button 
                          variant="secondary" 
                          className="flex-1 shadow-sm w-full" 
                          size="sm" 
                          disabled={!isAfter4PM}
                          onClick={handleCheckOut}
                        >
                          <LogOut size={14} className="mr-2" /> Check Out
                        </Button>
                      </div>
                    </Tooltip>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
