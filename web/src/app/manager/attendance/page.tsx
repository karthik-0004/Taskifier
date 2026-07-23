"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/ui/toast"
import { useAttendance } from "@/lib/api-hooks"

interface AttendanceRow {
  id: string
  name: string
  date: string
  checkedIn: string | null
  checkedOut: string | null
  status: "present" | "partial" | "absent"
}

function getStatus(
  checkedIn: string | null,
  checkedOut: string | null,
): AttendanceRow["status"] {
  if (!checkedIn) return "absent"
  if (!checkedOut) return "partial"
  return "present"
}

function statusBadge(status: AttendanceRow["status"]) {
  switch (status) {
    case "present":
      return <Badge variant="success">Present</Badge>
    case "partial":
      return <Badge variant="warning">Partial</Badge>
    case "absent":
      return <Badge variant="danger">Absent</Badge>
  }
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

const columns: Column<AttendanceRow>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (row) => <span className="text-muted-foreground">{row.date}</span>,
  },
  {
    key: "checkedIn",
    header: "Check-In",
    sortable: true,
    render: (row) => (
      <span className="text-muted-foreground">{row.checkedIn ?? "—"}</span>
    ),
  },
  {
    key: "checkedOut",
    header: "Check-Out",
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

export default function ManagerAttendancePage() {
  const { toast } = useToast()
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const { data, loading, error } = useAttendance({
    startDate: fromDate || undefined,
    endDate: toDate || undefined,
  })

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const rows: AttendanceRow[] = useMemo(() => {
    return (data ?? []).map((a) => {
      const checkedIn = formatTime(a.checkInAt)
      const checkedOut = formatTime(a.checkOutAt)
      return {
        id: `${a.userId}-${formatDate(a.date)}`,
        name: a.user.name,
        date: formatDate(a.date),
        checkedIn,
        checkedOut,
        status: getStatus(checkedIn, checkedOut),
      }
    })
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Team attendance and time tracking across all dates"
      />

      <div className="flex flex-wrap items-center gap-3">
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
        <Skeleton variant="rectangular" className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          message="No attendance records match the selected date range"
          description="Try expanding the date range to see more results."
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
