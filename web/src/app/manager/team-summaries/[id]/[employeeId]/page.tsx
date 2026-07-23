"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Mail, Briefcase, GitCommit, FileEdit, Clock } from "lucide-react"
import { ReportHeader } from "@/components/ui/report-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { MetricsCard } from "@/components/ui/metrics-card"
import { AttendanceBadge } from "@/components/ui/attendance-badge"
import { AISummaryCard } from "@/components/ui/ai-summary-card"
import { CommitList } from "@/components/ui/commit-list"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProjectDailySummary } from "@/lib/api-hooks"

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function EmployeeDailyDetailPage() {
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>()
  const searchParams = useSearchParams()
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const router = useRouter()
  const { toast } = useToast()

  const { data, loading, error } = useProjectDailySummary(id, date)

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const employeeData = data?.employees.find((e) => e.userId === employeeId)

  const commits = (employeeData?.activityEvents ?? [])
    .filter((e) => e.type === "COMMIT")
    .map((e) => ({
      id: e.id,
      message: (e.payload as any)?.message as string | undefined,
      hash: (e.payload as any)?.hash as string | undefined,
      timestamp: e.timestamp,
    }))

  const fileEdits = (employeeData?.activityEvents ?? [])
    .filter((e) => e.type === "FILE_EDIT")

  return (
    <div className="space-y-6">
      <ReportHeader
        title={employeeData?.name ?? "Employee Details"}
        subtitle={date}
        onBack={() => router.push(`/manager/team-summaries/${id}`)}
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="rectangular" className="h-32 w-full" />
          <Skeleton variant="rectangular" className="h-48 w-full" />
        </div>
      ) : !employeeData ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-body text-muted-foreground">No data found for this employee on {date}.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Personal Information */}
          <motion.div variants={staggerItem}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <Avatar name={employeeData.name} size="lg" />
                <div className="space-y-1">
                  <h2 className="text-h2">{employeeData.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {employeeData.position ?? "—"}</span>
                    <span className="flex items-center gap-1"><Mail size={12} /> {employeeData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="accent">{employeeData.role.replace(/_/g, " ")}</Badge>
                    {employeeData.skills?.split(",").map((s) => (
                      <Badge key={s.trim()} variant="default">{s.trim()}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metrics */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <MetricsCard label="Commits" value={employeeData.commitCount} icon={<GitCommit size={18} />} />
            <MetricsCard label="File Edits" value={employeeData.fileEditCount} icon={<FileEdit size={18} />} />
            <MetricsCard label="Total Time" value={`${Math.floor(employeeData.totalMinutes / 60)}h ${employeeData.totalMinutes % 60}m`} icon={<Clock size={18} />} />
            <MetricsCard label="Attendance" value={employeeData.checkIn ? "Present" : "Absent"} icon={<Clock size={18} />} />
          </motion.div>

          {/* Attendance */}
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-body-sm font-semibold">Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceBadge
                  checkIn={employeeData.checkIn}
                  checkOut={employeeData.checkOut}
                  totalMinutes={employeeData.totalMinutes}
                />
                {employeeData.checkIn && (
                  <div className="flex items-center gap-4 mt-2 text-body-sm">
                    <div>
                      <span className="text-muted-foreground">Check-in: </span>
                      <span className="font-medium">{formatTime(employeeData.checkIn)}</span>
                    </div>
                    {employeeData.checkOut && (
                      <div>
                        <span className="text-muted-foreground">Check-out: </span>
                        <span className="font-medium">{formatTime(employeeData.checkOut)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Commits */}
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
                  <GitCommit size={14} /> Commits ({commits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommitList commits={commits} />
              </CardContent>
            </Card>
          </motion.div>

          {/* File Changes */}
          {fileEdits.length > 0 && (
            <motion.div variants={staggerItem}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-body-sm font-semibold flex items-center gap-2">
                    <FileEdit size={14} /> Files Modified ({fileEdits.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {fileEdits.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-body-sm">
                        <FileEdit size={12} className="shrink-0 text-muted-foreground" />
                        <span>{(e.payload as any)?.file ?? (e.payload as any)?.path ?? "Unknown file"}</span>
                        <span className="text-caption text-muted-foreground ml-auto">{formatTime(e.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Summary */}
          {employeeData.summaryContent && (
            <motion.div variants={staggerItem}>
              <AISummaryCard text={employeeData.summaryContent} title="AI Generated Daily Summary" />
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
