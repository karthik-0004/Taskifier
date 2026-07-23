"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { FileText, User } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Select } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/ui/toast"
import { useTeamReports, useUsers, parseReportContent } from "@/lib/api-hooks"

function formatWeekDisplay(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z")
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  return `${fmt(start)} – ${fmt(end)}`
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function WeeklyReportsPage() {
  const { toast } = useToast()
  const { data: usersData } = useUsers()
  const { data: reportsData, loading, error } = useTeamReports()
  const [employeeFilter, setEmployeeFilter] = useSyncedState("all")
  const [weekFilter, setWeekFilter] = useSyncedState("")

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const employees = usersData ?? []

  const allWeeks = useMemo(() => {
    const weeks = new Set<string>()
    for (const r of reportsData ?? []) {
      weeks.add(formatDate(r.weekStart))
    }
    return Array.from(weeks).sort().reverse()
  }, [reportsData])

  const filtered = useMemo(() => {
    return (reportsData ?? [])
      .filter((r) => employeeFilter === "all" || r.userId === employeeFilter)
      .filter((r) => !weekFilter || formatDate(r.weekStart) === weekFilter)
      .map((r) => ({
        employeeId: r.userId,
        employeeName: r.user?.name ?? "Unknown",
        weekStart: formatDate(r.weekStart),
        parsed: parseReportContent(r.content),
      }))
  }, [reportsData, employeeFilter, weekFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Reports"
        subtitle="AI-generated weekly engineering reports"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-56">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="pl-9"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative w-56">
          <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="pl-9"
          >
            <option value="">All Weeks</option>
            {allWeeks.map((week) => (
              <option key={week} value={week}>
                {formatWeekDisplay(week)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="max-w-2xl space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-64 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message="No reports match the selected filters"
          description="Try selecting a different employee or week."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl space-y-6"
        >
          {filtered.map((item) => (
            <motion.div
              key={`${item.employeeId}-${item.weekStart}`}
              variants={staggerItem}
            >
              <div className="rounded-xl border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={item.employeeName} size="md" />
                  <div>
                    <p className="text-body font-medium">{item.employeeName}</p>
                    <p className="text-caption text-muted-foreground">
                      {formatWeekDisplay(item.weekStart)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 text-body-sm">
                  <ReportSection
                    label="Features Completed"
                    items={item.parsed.featuresCompleted}
                  />

                  <ReportSection
                    label="Bugs Fixed"
                    items={item.parsed.bugsFixed}
                  />

                  <div>
                    <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
                      Pull Requests Merged
                    </span>
                    <p className="mt-1 text-foreground font-semibold tabular-nums">
                      {item.parsed.prsMerged || "—"}
                    </p>
                  </div>

                  {item.parsed.blockers.length > 0 && (
                    <ReportSection
                      label="Blockers"
                      items={item.parsed.blockers}
                    />
                  )}

                  <ReportSection
                    label="Upcoming Work"
                    items={item.parsed.upcomingWork}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function ReportSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-foreground leading-relaxed">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/40" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function useSyncedState(initial: string): [string, (v: string) => void] {
  const [val, setVal] = useState(initial)
  return [val, setVal]
}
