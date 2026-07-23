"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Calendar, Users, Clock, GitCommit, FileEdit } from "lucide-react"
import { ReportHeader } from "@/components/ui/report-header"
import { MetricsCard } from "@/components/ui/metrics-card"
import { DateSelector } from "@/components/ui/date-selector"
import { EmployeeSummaryCard } from "@/components/ui/employee-summary-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProjectDailySummary } from "@/lib/api-hooks"

export default function ProjectSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  const { data, loading, error } = useProjectDailySummary(id, selectedDate)

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const totalMinutes = data?.employees.reduce((sum, e) => sum + e.totalMinutes, 0) ?? 0
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10
  const totalCommits = data?.employees.reduce((sum, e) => sum + e.commitCount, 0) ?? 0
  const totalEdits = data?.employees.reduce((sum, e) => sum + e.fileEditCount, 0) ?? 0
  const presentCount = data?.employees.filter((e) => e.checkIn).length ?? 0

  return (
    <div className="space-y-6">
      <ReportHeader
        title={data?.project.name ?? "Project Summary"}
        subtitle={data ? `${data.project.code} · ${data.employees.length} members` : "Loading..."}
        onBack={() => router.push("/manager/team-summaries")}
        right={<DateSelector value={selectedDate} onChange={setSelectedDate} />}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-64" />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={staggerItem}>
              <MetricsCard label="Present Today" value={`${presentCount}/${data.employees.length}`} icon={<Users size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="Total Hours" value={`${totalHours}h`} icon={<Clock size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="Commits" value={totalCommits} icon={<GitCommit size={18} />} />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricsCard label="File Changes" value={totalEdits} icon={<FileEdit size={18} />} />
            </motion.div>
          </motion.div>

          <div>
            <h2 className="text-h3 mb-4">Team Members</h2>
            {data.employees.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="text-body-sm text-muted-foreground">No employees assigned to this project.</p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {data.employees.map((emp) => (
                  <motion.div key={emp.userId} variants={staggerItem}>
                    <EmployeeSummaryCard
                      employee={emp}
                      onViewDetails={(userId) => router.push(`/manager/team-summaries/${id}/${userId}?date=${selectedDate}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
