"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Calendar, User } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Select } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/ui/toast"
import { useTeamSummaries, useUsers, parseSummaryContent } from "@/lib/api-hooks"

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function TeamSummariesPage() {
  const { toast } = useToast()
  const { data: usersData } = useUsers()
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const { data: summariesData, loading, error } = useTeamSummaries({
    employeeId: employeeFilter !== "all" ? employeeFilter : undefined,
    startDate: fromDate || undefined,
    endDate: toDate || undefined,
  })

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const employees = usersData ?? []

  const filtered = useMemo(() => {
    return (summariesData ?? []).map((s) => ({
      employeeId: s.userId,
      employeeName: s.user?.name ?? "Unknown",
      date: formatDate(s.date),
      parsed: parseSummaryContent(s.editedContent ?? s.aiGeneratedContent),
    }))
  }, [summariesData])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Summaries"
        subtitle="Approved daily summaries from your team — read-only"
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
        <div className="relative w-40">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-body-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:border-foreground/30 transition-colors"
            placeholder="From"
            aria-label="From date"
          />
        </div>
        <div className="relative w-40">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-body-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:border-foreground/30 transition-colors"
            placeholder="To"
            aria-label="To date"
          />
        </div>
      </div>

      {loading ? (
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message="No summaries match the selected filters"
          description="Try adjusting the employee or date range to see more results."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl space-y-4"
        >
          {filtered.map((item) => (
            <motion.div
              key={`${item.employeeId}-${item.date}`}
              variants={staggerItem}
            >
              <div className="rounded-xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.employeeName} size="sm" />
                    <div>
                      <p className="text-body-sm font-medium">{item.employeeName}</p>
                      <p className="text-caption text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <Badge variant="success">Approved</Badge>
                </div>

                <div className="space-y-4 text-body-sm">
                  <Section label="Today&rsquo;s Work" text={item.parsed.todayWork} />
                  <Section label="In Progress" text={item.parsed.inProgress} />
                  {item.parsed.blockers && (
                    <Section label="Blockers" text={item.parsed.blockers} />
                  )}
                  <Section label="Tomorrow" text={item.parsed.tomorrow} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
      <p className="mt-1 text-foreground leading-relaxed">{text}</p>
    </div>
  )
}
