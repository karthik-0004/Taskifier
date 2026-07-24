"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, GitCommit, FileEdit, Clock, Activity, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Drawer } from "@/components/ui/drawer"
import { useToast } from "@/components/ui/toast"
import { useUsers } from "@/lib/api-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Calendar as CalendarIcon } from "lucide-react"
import { DailySummaryContent } from "@/components/ui/daily-summary-content"
import { ActivityCalendar } from "@/components/calendar/ActivityCalendar"

export default function EmployeeActivityCalendarPage() {
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  
  const { data: usersData, loading: usersLoading } = useUsers()
  const employee = (usersData ?? []).find((u) => u.id === employeeId)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Fetch Attendance for the current month
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoadingAttendance(true)
        const monthIndex = currentDate.getMonth()
        const res = await fetch(`/api/employees/${employeeId}/attendance?month=${monthIndex}`)
        if (res.ok) {
          const data = await res.json()
          setAttendanceData(data)
        } else {
          toast("Failed to load attendance", "error")
        }
      } catch (err) {
        toast("Error loading attendance data", "error")
      } finally {
        setLoadingAttendance(false)
      }
    }
    fetchAttendance()
  }, [currentDate, employeeId, toast])




  if (usersLoading) {
    return (
      <div className="space-y-8">
        <Skeleton variant="text" className="h-4 w-32 mb-4" />
        <Skeleton variant="text" className="h-8 w-72" />
        <Skeleton variant="rectangular" className="h-[600px] w-full" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-body text-muted-foreground">Employee not found.</p>
        <Button variant="secondary" onClick={() => router.push(`/manager/team-summaries/${id}`)}>Back to Team Summary</Button>
      </div>
    )
  }



  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <button
        onClick={() => router.push(`/manager/team-summaries/${id}`)}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft size={14} /> Back to Team Summary
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 mb-2">{employee.name}</h1>
          <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
            <span className="capitalize">{employee.role.toLowerCase()}</span>
            <span>•</span>
            <span>{employee.email}</span>
          </div>
        </div>
      </div>

      {/* Calendar and Summary Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-none">
          {loadingAttendance ? (
            <Skeleton variant="rectangular" className="h-[400px] w-[380px] rounded-2xl" />
          ) : (
            <ActivityCalendar 
              mode="employee" 
              attendance={attendanceData} 
              selectedDate={selectedDate ? new Date(selectedDate) : null}
              onDateSelect={(date) => {
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                // Parse attendance dates to match local keys
                const record = attendanceData.find(a => {
                  if (a.status === "future") return false
                  if (!a.date) return false
                  const d = new Date(a.date)
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === dateStr
                })
                if (record && record.status !== "future") {
                  setSelectedDate(dateStr)
                }
              }}
            />
          )}
        </div>
        
        <div className="flex-1 w-full border border-border/60 rounded-xl bg-card/40 p-6 shadow-sm min-h-[400px]">
          {selectedDate ? (
            <DailySummaryContent employeeId={employeeId} selectedDate={selectedDate} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground pt-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Date Selected</h3>
              <p className="text-sm max-w-sm">Select a day on the calendar to view detailed work activities, commits, and AI summaries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
