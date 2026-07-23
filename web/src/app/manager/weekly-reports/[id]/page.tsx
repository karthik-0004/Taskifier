"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Users, GitCommit, Clock, BarChart3, Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { ReportHeader } from "@/components/ui/report-header"
import { MetricsCard } from "@/components/ui/metrics-card"
import { WeekSelector } from "@/components/ui/week-selector"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ExpandableSection } from "@/components/ui/expandable-section"
import { AISummaryCard } from "@/components/ui/ai-summary-card"
import { useToast } from "@/components/ui/toast"
import { useProjectDailySummary, useProjects, type ProjectDailyEmployeeDTO } from "@/lib/api-hooks"

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

interface DayData {
  label: string
  date: string
  employees: ProjectDailyEmployeeDTO[]
  totalCommits: number
  totalMinutes: number
}

interface EmployeeWeekData {
  userId: string
  name: string
  position: string | null
  role: string
  totalCommits: number
  totalMinutes: number
  days: DayData[]
}

export default function WeeklyReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const { data: project } = useProjects()

  const projectInfo = (project ?? []).find((p) => p.id === id)

  const monday = new Date(weekStart + "T00:00:00")
  const dates = DAYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const dayQueries = dates.map((date) => ({
    date,
    hook: useProjectDailySummary(id, date),
  }))

  const daysData: DayData[] = dayQueries.map((q, i) => ({
    label: DAYS[i],
    date: q.date,
    employees: q.hook.data?.employees ?? [],
    totalCommits: q.hook.data?.employees.reduce((s, e) => s + e.commitCount, 0) ?? 0,
    totalMinutes: q.hook.data?.employees.reduce((s, e) => s + e.totalMinutes, 0) ?? 0,
  }))

  const loading = dayQueries.some((q) => q.hook.loading)
  const errors = dayQueries.filter((q) => q.hook.error)

  useEffect(() => {
    errors.forEach((q) => {
      if (q.hook.error) toast(q.hook.error, "error")
    })
  }, [errors.map((e) => e.hook.error).join(",")])

  // Aggregate per employee across the week
  const employeeWeekMap = new Map<string, EmployeeWeekData>()
  for (const day of daysData) {
    for (const emp of day.employees) {
      let existing = employeeWeekMap.get(emp.userId)
      if (!existing) {
        existing = {
          userId: emp.userId,
          name: emp.name,
          position: emp.position,
          role: emp.role,
          totalCommits: 0,
          totalMinutes: 0,
          days: DAYS.map((_, i) => ({
            label: DAYS[i],
            date: dates[i],
            employees: [],
            totalCommits: 0,
            totalMinutes: 0,
          })),
        }
        employeeWeekMap.set(emp.userId, existing)
      }
      existing.totalCommits += emp.commitCount
      existing.totalMinutes += emp.totalMinutes
      existing.days[DAYS.indexOf(day.label)].employees.push(emp)
      existing.days[DAYS.indexOf(day.label)].totalCommits += emp.commitCount
      existing.days[DAYS.indexOf(day.label)].totalMinutes += emp.totalMinutes
    }
  }
  const employeeWeekData = Array.from(employeeWeekMap.values())

  const weekTotalCommits = daysData.reduce((s, d) => s + d.totalCommits, 0)
  const weekTotalMinutes = daysData.reduce((s, d) => s + d.totalMinutes, 0)
  const weekTotalHours = Math.round(weekTotalMinutes / 60 * 10) / 10

  return (
    <div className="space-y-6">
      <ReportHeader
        title={projectInfo?.name ?? "Weekly Report"}
        subtitle={`${projectInfo?.code ?? ""} · ${projectInfo?.assignments.length ?? 0} members`}
        onBack={() => router.push("/manager/weekly-reports")}
        right={<WeekSelector weekStart={weekStart} onChange={setWeekStart} />}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-24" />
            ))}
          </div>
          <Skeleton variant="rectangular" className="h-64 w-full" />
        </div>
      ) : (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={staggerItem}>
              <MetricsCard label="Team Members" value={employeeWeekData.length} icon={<Users size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="Total Commits" value={weekTotalCommits} icon={<GitCommit size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="Total Hours" value={`${weekTotalHours}h`} icon={<Clock size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="Days Tracked" value={daysData.filter((d) => d.employees.length > 0).length + "/5"} icon={<Calendar size={18} />} />
            </motion.div>
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-h3">Team Overview</h2>
            {employeeWeekData.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="text-body-sm text-muted-foreground">No activity data for this week.</p>
              </div>
            ) : (
              employeeWeekData.map((emp) => (
                <motion.div key={emp.userId} variants={staggerItem}>
                  <ExpandableSection
                    title={emp.name}
                    badge={`${emp.totalCommits} commits · ${Math.floor(emp.totalMinutes / 60)}h ${emp.totalMinutes % 60}m`}
                  >
                    <div className="space-y-4 pt-2">
                      {/* Employee Week Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-muted/30 p-3 text-center">
                          <p className="text-h3">{emp.totalCommits}</p>
                          <p className="text-caption text-muted-foreground">Total Commits</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3 text-center">
                          <p className="text-h3">{Math.floor(emp.totalMinutes / 60)}h {emp.totalMinutes % 60}m</p>
                          <p className="text-caption text-muted-foreground">Total Hours</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3 text-center">
                          <p className="text-h3">{emp.days.filter((d) => d.employees.length > 0).length}</p>
                          <p className="text-caption text-muted-foreground">Active Days</p>
                        </div>
                      </div>

                      {/* Daily Breakdown */}
                      {emp.days.filter((d) => d.employees.length > 0).length > 0 && (
                        <div className="space-y-3">
                          <p className="text-body-sm font-medium text-muted-foreground">Daily Breakdown</p>
                          {emp.days.filter((d) => d.employees.length > 0).map((day) => (
                            <div key={day.date} className="rounded-lg border p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar size={12} className="text-muted-foreground" />
                                  <span className="text-body-sm font-medium">{day.label}</span>
                                  <span className="text-caption text-muted-foreground">{day.date}</span>
                                </div>
                                <div className="flex items-center gap-3 text-caption text-muted-foreground">
                                  <span>{day.totalCommits} commits</span>
                                  <span>{Math.floor(day.totalMinutes / 60)}h {day.totalMinutes % 60}m</span>
                                </div>
                              </div>
                              {day.employees.length > 0 && (
                                <div className="space-y-2">
                                  {day.employees.map((e) => (
                                    <div key={e.userId} className="flex items-center justify-between text-body-sm">
                                      <span className="text-muted-foreground">Check-in: {e.checkIn ? new Date(e.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}</span>
                                      <span>Commits: {e.commitCount}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {day.employees.some((e) => e.summaryContent) && (
                                <AISummaryCard
                                  text={day.employees.find((e) => e.summaryContent)?.summaryContent ?? null}
                                  compact
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ExpandableSection>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
