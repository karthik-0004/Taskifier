"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, GitCommit, Clock, Activity, Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { ExpandableSection } from "@/components/ui/expandable-section"
import { DailySummaryDrawer } from "@/components/ui/daily-summary-drawer"
import { useProjects } from "@/lib/api-hooks"

export default function WeeklyReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const { data: projectData } = useProjects()
  const projectInfo = (projectData ?? []).find((p) => p.id === id)

  // Helper to get Monday of a given date
  const getMonday = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    return date
  }

  const [currentDate, setCurrentDate] = useState(getMonday(new Date("2026-07-15")))
  const week = currentDate.toISOString().split("T")[0]
  const [overviewData, setOverviewData] = useState<any>(null)
  const [employeeDetails, setEmployeeDetails] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/projects/${id}/weekly-summary?week=${week}`)
        if (res.ok) {
          const data = await res.json()
          setOverviewData(data)
          
          // Pre-fetch employee details for the mock employees
          if (data.heatmap) {
            const detailsMap: Record<string, any> = {}
            for (const emp of data.heatmap) {
              const empRes = await fetch(`/api/projects/${id}/employees/${emp.id}/weekly`)
              if (empRes.ok) {
                detailsMap[emp.id] = await empRes.json()
              }
            }
            setEmployeeDetails(detailsMap)
          }
        }
      } catch (err) {
        toast("Failed to load weekly report data", "error")
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [id, week, toast])

  const openDrawer = (employeeId: string, dayIndex: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + dayIndex)
    const dateStr = d.toISOString().split('T')[0]
    setSelectedEmployeeId(employeeId)
    setSelectedDateStr(dateStr)
    setDrawerOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500"
      case "absent": return "bg-red-500"
      case "half-day": return "bg-yellow-500"
      case "weekend": return "bg-muted-foreground/30"
      default: return "bg-muted"
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500/10 border-green-500/20 hover:border-green-500/50"
      case "absent": return "bg-red-500/10 border-red-500/20 hover:border-red-500/50"
      case "half-day": return "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/50"
      case "weekend": return "bg-muted/50 border-transparent"
      default: return "bg-card border-border"
    }
  }

  const prevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const getWeekDisplay = () => {
    const endOfWeek = new Date(currentDate)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    return `${currentDate.toLocaleDateString("en-US", options)} – ${endOfWeek.toLocaleDateString("en-US", options)}`
  }

  if (loading || !overviewData) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-16 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
        </div>
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/manager/weekly-reports")}
            className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft size={14} /> Back to Weekly Reports
          </button>
          <h1 className="text-h1 mb-1">{projectInfo?.name ?? "Project Summary"}</h1>
          <p className="text-body-sm text-muted-foreground">{projectInfo?.code ?? "PRJ-CODE"}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-card border rounded-lg px-4 py-2 flex items-center justify-between min-w-[200px]">
            <span className="text-sm font-medium">Week: {getWeekDisplay()}</span>
          </div>
          <div className="flex items-center border rounded-md overflow-hidden bg-card">
            <Button variant="ghost" size="icon" className="rounded-none" onClick={prevWeek}>
              <ChevronLeft size={18} />
            </Button>
            <div className="w-px h-5 bg-border"></div>
            <Button variant="ghost" size="icon" className="rounded-none" onClick={nextWeek}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Team Members</p>
              <p className="text-2xl font-semibold mt-0.5">{overviewData.teamMembers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <GitCommit size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Commits</p>
              <p className="text-2xl font-semibold mt-0.5">{overviewData.totalCommits}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Coding Hours</p>
              <p className="text-2xl font-semibold mt-0.5">{overviewData.codingHours}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Productivity</p>
              <p className="text-2xl font-semibold mt-0.5">{overviewData.productivityScore}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar size={18} /> Weekly Calendar
          </h2>
          <div className="flex gap-2">
            {overviewData.weeklyCalendar.map((day: any, i: number) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openDrawer(overviewData.heatmap?.[0]?.id || "emp-1", i)}
                className={`flex-1 rounded-xl border p-4 cursor-pointer transition-all ${getStatusBgColor(day.status)} flex flex-col items-center justify-center text-center`}
              >
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{day.day}</span>
                <span className="text-2xl font-semibold mb-3">{day.date}</span>
                <span className={`w-3 h-3 rounded-full mb-3 shadow-sm ${getStatusColor(day.status)}`} />
                <div className="text-[10px] font-medium opacity-70">
                  <p>{day.commits} commits</p>
                  <p>{day.hours}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Heatmap */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="p-6 border-b bg-muted/10">
          <h2 className="text-lg font-semibold">Team Heatmap</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-4 py-4 text-center font-medium">Mon</th>
                <th className="px-4 py-4 text-center font-medium">Tue</th>
                <th className="px-4 py-4 text-center font-medium">Wed</th>
                <th className="px-4 py-4 text-center font-medium">Thu</th>
                <th className="px-4 py-4 text-center font-medium">Fri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overviewData.heatmap.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium">{emp.name}</td>
                  {emp.attendance.map((status: string, i: number) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <button 
                        onClick={() => openDrawer(emp.id, i)}
                        className={`inline-block w-4 h-4 rounded-full shadow-sm hover:scale-125 transition-transform ${getStatusColor(status)}`} 
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee Accordion */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mt-4">Employee Breakdown</h2>
        {overviewData.heatmap.map((emp: any) => {
          const details = employeeDetails[emp.id]
          if (!details) return null

          return (
            <ExpandableSection key={emp.id} title={details.name} badge={`${details.totalCommits} commits`}>
              <div className="pt-4 space-y-6">
                
                {/* Stats row inside accordion */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-center border">
                    <p className="text-xl font-semibold">{details.totalCommits}</p>
                    <p className="text-[10px] uppercase text-muted-foreground mt-1">Commits</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center border">
                    <p className="text-xl font-semibold">{details.codingHours}</p>
                    <p className="text-[10px] uppercase text-muted-foreground mt-1">Coding Hours</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center border">
                    <p className="text-xl font-semibold">{details.filesEdited}</p>
                    <p className="text-[10px] uppercase text-muted-foreground mt-1">Files Edited</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center border">
                    <p className="text-xl font-semibold">{details.attendanceStats.present}/5</p>
                    <p className="text-[10px] uppercase text-muted-foreground mt-1">Attendance</p>
                  </div>
                  <div className="bg-primary/5 border-primary/20 rounded-lg p-3 text-center border text-primary">
                    <p className="text-xl font-semibold">{details.productivityScore}</p>
                    <p className="text-[10px] uppercase mt-1">AI Score</p>
                  </div>
                </div>

                {/* AI Summary */}
                {details.summary && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                      <Activity size={80} />
                    </div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-primary">
                      <Activity size={16} /> AI Weekly Summary
                    </h4>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {details.summary}
                    </p>
                  </div>
                )}

                {/* Weekly Timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" /> Weekly Activity Timeline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.timeline.map((day: any, i: number) => {
                      if (day.status === "weekend") return null
                      return (
                        <div key={i} className="border rounded-xl p-4 bg-card/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-sm">{day.day}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              day.status === "present" ? "bg-green-500/10 text-green-500" :
                              day.status === "absent" ? "bg-red-500/10 text-red-500" :
                              "bg-yellow-500/10 text-yellow-500"
                            }`}>
                              {day.status}
                            </span>
                          </div>
                          {day.status === "absent" ? (
                            <p className="text-sm text-muted-foreground">Absent on this day.</p>
                          ) : (
                            <ul className="space-y-2">
                              {day.events.map((event: string, j: number) => (
                                <li key={j} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                  <span className="text-foreground/80">{event}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </ExpandableSection>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Daily Commits</h3>
            <div className="space-y-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => {
                const vals = [30, 50, 10, 40, 60]
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs w-8 text-muted-foreground font-medium">{day}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${vals[i]}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Coding Hours</h3>
            <div className="space-y-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => {
                const vals = [8, 9, 7.5, 8.5, 9.5]
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs w-8 text-muted-foreground font-medium">{day}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(vals[i]/10)*100}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Attendance Split</h3>
            <div className="flex items-center justify-center h-[120px]">
              <div className="relative w-24 h-24 rounded-full border-[16px] border-green-500 border-r-red-500 border-b-yellow-500 rotate-45 shadow-inner"></div>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Absent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Half Day</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {drawerOpen && (
        <DailySummaryDrawer
          employeeId={selectedEmployeeId}
          selectedDate={selectedDateStr}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
