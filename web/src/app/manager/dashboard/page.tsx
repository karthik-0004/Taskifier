"use client"

import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem, slideUp } from "@/components/animations"
import { Users, FolderKanban, CheckCircle2, Clock } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { DataTable, type Column } from "@/components/data-table"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useDashboard } from "@/lib/api-hooks"
import { useEffect } from "react"

interface ActiveSession {
  id: string
  name: string
  project: string
  startedAt: string
}

interface AttendanceRecord {
  id: string
  name: string
  checkedIn: string | null
  checkedOut: string | null
  status: "checked_in" | "checked_out" | "absent"
}

function elapsedSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function statusBadge(status: AttendanceRecord["status"]) {
  switch (status) {
    case "checked_in":
      return <Badge variant="success">Checked In</Badge>
    case "checked_out":
      return <Badge variant="default">Checked Out</Badge>
    case "absent":
      return <Badge variant="danger">Absent</Badge>
  }
}

const columns: Column<AttendanceRecord>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-foreground">{row.name}</span>
    ),
  },
  {
    key: "checkedIn",
    header: "Checked In",
    sortable: true,
    render: (row) => (
      <span className="text-muted-foreground">{row.checkedIn ?? "—"}</span>
    ),
  },
  {
    key: "checkedOut",
    header: "Checked Out",
    sortable: true,
    render: (row) => (
      <span className="text-muted-foreground">{row.checkedOut ?? "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => statusBadge(row.status),
  },
]

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data, loading, error } = useDashboard()

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-28" />
          ))}
        </div>
        <div>
          <Skeleton variant="text" className="h-6 w-40 mb-4" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-32 w-52 shrink-0" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton variant="text" className="h-6 w-48 mb-4" />
          <Skeleton variant="rectangular" className="h-64 w-full" />
        </div>
      </div>
    )
  }

  const activeSessions: ActiveSession[] = (data?.activeSessions ?? []).map((s) => ({
    id: s.userId,
    name: s.userName,
    project: s.projectName ?? "Unknown",
    startedAt: s.startedAt,
  }))

  const allEmployeeIds = new Set<string>()
  const checkedInMap = new Map<string, AttendanceRecord>()
  for (const ci of data?.attendance.checkedIn ?? []) {
    allEmployeeIds.add(ci.id)
    checkedInMap.set(ci.id, {
      id: ci.id,
      name: ci.name,
      checkedIn: formatTime(ci.checkedInAt),
      checkedOut: null,
      status: "checked_in",
    })
  }
  for (const nci of data?.attendance.notCheckedIn ?? []) {
    allEmployeeIds.add(nci.id)
    if (!checkedInMap.has(nci.id)) {
      checkedInMap.set(nci.id, {
        id: nci.id,
        name: nci.name,
        checkedIn: null,
        checkedOut: null,
        status: "absent",
      })
    }
  }
  const todayAttendance = Array.from(checkedInMap.values())

  return (
    <div className="space-y-8">
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <h1 className="text-h1">Good morning, {user?.name?.split(" ")[0]}</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Here&rsquo;s what&rsquo;s happening across your team today.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            label="Active Employees"
            value={data?.totalActiveEmployees ?? 0}
            icon={<Users size={18} />}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Active Projects"
            value={data?.totalActiveProjects ?? 0}
            icon={<FolderKanban size={18} />}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Approved Today"
            value={data?.summaries.approved ?? 0}
            icon={<CheckCircle2 size={18} />}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Pending Today"
            value={data?.summaries.pending ?? 0}
            icon={<Clock size={18} />}
          />
        </motion.div>
      </motion.div>

      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3">Active Sessions</h2>
          <span className="text-caption text-muted-foreground">
            {activeSessions.length} currently working
          </span>
        </div>
        <HorizontalScroller>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex gap-4"
          >
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                variants={staggerItem}
                className="w-52 shrink-0 rounded-xl border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={session.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium truncate">{session.name}</p>
                  </div>
                </div>
                <p className="text-caption text-muted-foreground truncate mb-2">
                  {session.project}
                </p>
                <div className="flex items-center gap-1.5 text-caption text-accent">
                  <Clock size={12} />
                  <span>{elapsedSince(session.startedAt)} elapsed</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </HorizontalScroller>
      </motion.div>

      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <h2 className="text-h3 mb-4">Today&rsquo;s Attendance</h2>
        <DataTable
          columns={columns}
          data={todayAttendance}
          keyExtractor={(row) => row.id}
        />
      </motion.div>
    </div>
  )
}
