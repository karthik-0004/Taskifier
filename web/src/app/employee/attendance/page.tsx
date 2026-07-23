"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { slideUp } from "@/components/animations"
import { LogIn, LogOut, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type Column } from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/ui/toast"
import { useMyAttendance, checkIn, checkOut } from "@/lib/api-hooks"

interface AttendanceRow {
  id: string
  date: string
  checkedIn: string
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

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

const columns: Column<AttendanceRow>[] = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (row) => <span className="text-foreground">{row.date}</span>,
  },
  {
    key: "checkedIn",
    header: "Check-In",
    sortable: true,
    render: (row) => <span className="text-muted-foreground">{row.checkedIn || "—"}</span>,
  },
  {
    key: "checkedOut",
    header: "Check-Out",
    sortable: true,
    render: (row) => <span className="text-muted-foreground">{row.checkedOut || "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => statusBadge(row.status),
  },
]

export default function EmployeeAttendancePage() {
  const { toast } = useToast()
  const { data, loading, refresh } = useMyAttendance()

  const [checkedIn, setCheckedIn] = useState(false)
  const [checkedOut, setCheckedOut] = useState(false)

  useEffect(() => {
    if (!data) return
    const todayRec = data.find((a) => formatDate(a.date) === todayDateStr())
    setCheckedIn(!!todayRec?.checkInAt)
    setCheckedOut(!!todayRec?.checkOutAt)
  }, [data])

  const records: AttendanceRow[] = useMemo(() => {
    if (!data) return []
    return data
      .map((a) => ({
        id: `${a.userId}-${formatDate(a.date)}`,
        date: formatDate(a.date),
        checkedIn: formatTime(a.checkInAt) ?? "",
        checkedOut: formatTime(a.checkOutAt),
        status: getStatus(formatTime(a.checkInAt), formatTime(a.checkOutAt)),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data])

  function handleCheckIn() {
    checkIn()
      .then(() => {
        setCheckedIn(true)
        refresh()
        toast(
          "Checked in at " +
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          "success",
        )
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleCheckOut() {
    checkOut()
      .then(() => {
        setCheckedOut(true)
        refresh()
        toast(
          "Checked out at " +
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          "info",
        )
      })
      .catch((err) => toast(err.message, "error"))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Your attendance and time logs" />

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border bg-card p-5 shadow-soft"
      >
        {loading ? (
          <Skeleton variant="rectangular" className="h-16 w-full" />
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-h3">Today</h2>
              <p className="text-body-sm text-muted-foreground">
                {!checkedIn
                  ? "You haven&rsquo;t checked in yet."
                  : !checkedOut
                    ? "Checked in — don&rsquo;t forget to check out."
                    : "All done for today."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!checkedIn ? (
                <Button variant="accent" onClick={handleCheckIn}>
                  <LogIn size={14} />
                  Check In
                </Button>
              ) : !checkedOut ? (
                <Button variant="secondary" onClick={handleCheckOut}>
                  <LogOut size={14} />
                  Check Out
                </Button>
              ) : (
                <Badge variant="success" className="gap-1.5 py-2">
                  <CheckCircle2 size={14} />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-h3 mb-4">History</h2>
        {loading ? (
          <Skeleton variant="rectangular" className="h-48 w-full" />
        ) : records.length === 0 ? (
          <EmptyState
            message="No attendance records"
            description="Your attendance history will appear here once you start checking in."
          />
        ) : (
          <DataTable
            columns={columns}
            data={records}
            keyExtractor={(row) => row.id}
          />
        )}
      </motion.div>
    </div>
  )
}
