"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Clock,
  Play,
  Square,
  GitCommit,
  GitBranch,
  GitPullRequest,
  Eye,
  FileEdit,
  CheckCircle2,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  Briefcase,
  Users,
  Activity,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Tooltip
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"
import {
  useMyActiveSession,
  useMyAttendance,
  useMySummaries,
  useMyProjects,
  startSession,
  endSession,
  checkIn,
  checkOut,
} from "@/lib/api-hooks"

function formatHoursAndMinutes(ms: number): string {
  if (ms <= 0) return "—"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const { data: attendanceData, loading: attLoading, refresh: refreshAttendance } = useMyAttendance()
  const { data: projectsData, loading: projectsLoading } = useMyProjects()

  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [yesterdayDetails, setYesterdayDetails] = useState<any>(null)

  useEffect(() => {
    if (!attLoading && attendanceData) {
      const todayRec = attendanceData.find((a: any) => {
        if (!a.date) return false
        const d = new Date(a.date)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return dateKey === todayDateStr()
      })
      setTodayAttendance(todayRec || null)
    }
  }, [attendanceData, attLoading])

  useEffect(() => {
    if (!user?.id) return
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yestStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    
    fetch(`/api/employees/${user.id}/daily-summary?date=${yestStr}`)
      .then(res => {
        if (res.ok) return res.json()
        return null
      })
      .then(data => {
        if (data) setYesterdayDetails(data)
      })
      .catch(() => {})
  }, [user?.id])

  const handleCheckIn = () => {
    checkIn()
      .then(() => {
        refreshAttendance()
        toast("Checked in successfully", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  const handleCheckOut = () => {
    checkOut()
      .then(() => {
        refreshAttendance()
        toast("Checked out successfully. Have a great evening!", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  const isAfter4PM = new Date().getHours() >= 16

  const projects = projectsData ?? []
  const assignedProjects = projects.filter((p) =>
    p.assignments.some((a) => a.userId === user?.id),
  )

  const loading = attLoading || projectsLoading

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-96 mt-2" />
        </div>
        <Skeleton variant="rectangular" className="h-32 w-full" />
      </div>
    )
  }

  const formatTimeLocal = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  let currentStatus = "Not Checked In"
  let workingHours = "—"
  
  if (todayAttendance?.checkInAt) {
    if (todayAttendance?.checkOutAt) {
      currentStatus = "Checked Out"
      const diff = new Date(todayAttendance.checkOutAt).getTime() - new Date(todayAttendance.checkInAt).getTime()
      workingHours = formatHoursAndMinutes(diff)
    } else {
      currentStatus = "Active (Working)"
      const diff = Date.now() - new Date(todayAttendance.checkInAt).getTime()
      workingHours = formatHoursAndMinutes(diff)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-semibold tracking-tight">{getGreeting()}, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <CalendarIcon size={16} />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Attendance & Yesterday Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="h-full border-border/50 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Clock size={120} />
            </div>
            <CardHeader className="pb-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Today's Attendance
                </CardTitle>
                <Badge variant={currentStatus === "Active (Working)" ? "success" : "secondary"}>
                  {currentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Check In</p>
                  <p className="text-xl font-semibold">
                    {todayAttendance?.checkInAt ? formatTimeLocal(todayAttendance.checkInAt) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Check Out</p>
                  <p className="text-xl font-semibold">
                    {todayAttendance?.checkOutAt ? formatTimeLocal(todayAttendance.checkOutAt) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Working Hours</p>
                  <p className="text-xl font-semibold text-primary">{workingHours}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!todayAttendance?.checkInAt ? (
                  <Button className="flex-1 shadow-sm" size="lg" onClick={handleCheckIn}>
                    <LogIn size={16} className="mr-2" />
                    Check In
                  </Button>
                ) : !todayAttendance?.checkOutAt ? (
                  <Tooltip content={!isAfter4PM ? "You can check out after 4:00 PM." : null} side="top">
                    <div className="flex-1 flex">
                      <Button 
                        variant="secondary" 
                        className="flex-1 shadow-sm w-full" 
                        size="lg" 
                        disabled={!isAfter4PM}
                        onClick={handleCheckOut}
                      >
                        <LogOut size={16} className="mr-2" />
                        Check Out
                      </Button>
                    </div>
                  </Tooltip>
                ) : (
                  <Button variant="outline" className="flex-1 opacity-50" size="lg" disabled>
                    <CheckCircle2 size={16} className="mr-2" />
                    Checked Out
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Yesterday's Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="h-full border-border/50 shadow-sm bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity size={18} className="text-muted-foreground" /> Yesterday's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!yesterdayDetails || yesterdayDetails.attendance === "absent" ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                  <p className="text-sm">No activity recorded yesterday.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GitCommit size={16} className="text-emerald-500" />
                      {yesterdayDetails.commits?.length || 0} commits
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileEdit size={16} className="text-blue-500" />
                      {yesterdayDetails.fileEdits || 0} files edited
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock size={16} className="text-amber-500" />
                      {yesterdayDetails.workingHours || "—"} worked
                    </div>
                  </div>

                  {yesterdayDetails.summary ? (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Summary</p>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm leading-relaxed text-foreground/80">
                        {yesterdayDetails.summary}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* My Projects */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase size={20} className="text-primary" /> Active Projects
          </h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/employee/my-projects")}>
            View All <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-12 text-center text-muted-foreground bg-muted/5">
            <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
            <p>You are not assigned to any projects currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedProjects.map(project => {
              const myRole = project.assignments.find(a => a.userId === user?.id)?.role || "Member"
              
              const start = project.startDate ? new Date(project.startDate) : new Date()
              const end = project.expectedEndDate ? new Date(project.expectedEndDate) : new Date(start.getTime() + 90 * 24*60*60*1000)
              const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24))
              const passedDays = Math.max(0, (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
              const progress = Math.min(100, Math.round((passedDays / totalDays) * 100))
              const daysRemaining = Math.max(0, Math.ceil(totalDays - passedDays))

              return (
                <Card key={project.id} className="shadow-sm border-border/60 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{myRole}</p>
                      </div>
                      <Badge variant="outline" className="bg-background">{project.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-5">
                    
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <CalendarIcon size={14} className="text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground font-medium">Remaining</span>
                        <span className="text-sm font-semibold">{daysRemaining} d</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <Activity size={14} className="text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground font-medium">Priority</span>
                        <span className="text-sm font-semibold">{project.priority || "Normal"}</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <Users size={14} className="text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground font-medium">Team</span>
                        <span className="text-sm font-semibold">{project.assignments.length}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">Open Project</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">View Team</Button>
                      <Button size="sm" variant="secondary" className="flex-1 text-xs">Pipeline</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
