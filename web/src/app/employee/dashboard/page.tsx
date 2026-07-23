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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { useToast } from "@/components/ui/toast"
import {
  useMyActiveSession,
  useMyAttendance,
  useMySummaries,
  useSessionActivity,
  useMyProjects,
  startSession,
  endSession,
  checkIn,
  type ActivityEventDTO,
} from "@/lib/api-hooks"

type PageState = "check_in" | "start_work" | "in_session"

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function activityIcon(type: string) {
  switch (type) {
    case "COMMIT":
      return <GitCommit size={14} />
    case "BRANCH_SWITCH":
      return <GitBranch size={14} />
    case "PR_OPENED":
      return <GitPullRequest size={14} />
    case "FILE_EDIT":
      return <Eye size={14} />
    default:
      return <Eye size={14} />
  }
}

function formatActivityTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const { data: activeSession, loading: sessionLoading, refresh: refreshSession } = useMyActiveSession()
  const { data: attendanceData, loading: attLoading, refresh: refreshAttendance } = useMyAttendance()
  const { data: summariesData, loading: summariesLoading } = useMySummaries()
  const { data: projectsData } = useMyProjects()
  const { data: activityData } = useSessionActivity(activeSession?.id ?? null)

  const [checkedIn, setCheckedIn] = useState(false)
  const [session, setSession] = useState<typeof activeSession>(null)
  const [showProjectSelect, setShowProjectSelect] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!attLoading && attendanceData) {
      const todayRec = attendanceData.find((a) => a.date?.slice(0, 10) === todayDateStr())
      setCheckedIn(!!todayRec?.checkInAt)
    }
  }, [attendanceData, attLoading])

  useEffect(() => {
    setSession(activeSession)
  }, [activeSession])

  useEffect(() => {
    if (session) {
      const diff = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
      setElapsedSeconds(Math.max(0, diff))
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [session])

  const loading = sessionLoading || attLoading || summariesLoading

  const todaySummary = (summariesData ?? []).find((s) => s.date?.slice(0, 10) === todayDateStr())

  const projects = projectsData ?? []
  const empId = user?.id
  const assignedProjects = projects.filter((p) =>
    p.assignments.some((a) => a.userId === empId),
  )

  const activity: ActivityEventDTO[] = activityData ?? []

  const state: PageState = !checkedIn ? "check_in" : !session ? "start_work" : "in_session"

  function handleCheckIn() {
    checkIn()
      .then(() => {
        setCheckedIn(true)
        refreshAttendance()
        toast("Checked in at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleStartWork() {
    if (!selectedProject) return
    const project = projects.find((p) => p.id === selectedProject)
    if (!project) return
    startSession(project.id)
      .then((newSession) => {
        setSession(newSession)
        setShowProjectSelect(false)
        setSelectedProject("")
        refreshSession()
        toast(`Started working on ${project.name}`, "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  const handleEndSession = useCallback(() => {
    if (!session) return
    const duration = formatElapsed(elapsedSeconds)
    endSession(session.id)
      .then(() => {
        setSession(null)
        setElapsedSeconds(0)
        refreshSession()
        toast(`Session ended — ${duration} logged`, "info")
      })
      .catch((err) => toast(err.message, "error"))
  }, [session, elapsedSeconds, toast, refreshSession])

  if (loading && !session) {
    return (
      <div className="max-w-3xl space-y-8">
        <div>
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-96 mt-2" />
        </div>
        <Skeleton variant="rectangular" className="h-32 w-full" />
        <div>
          <Skeleton variant="text" className="h-6 w-40 mb-4" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
        </div>
        <Skeleton variant="rectangular" className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-h1">Good afternoon, {user?.name?.split(" ")[0]}</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          {state === "check_in"
            ? "You haven&rsquo;t checked in yet today."
            : state === "start_work"
              ? "Checked in — ready to start working?"
              : `Working on ${session?.project?.name ?? "a project"}`}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border bg-card p-6 shadow-soft"
      >
        {state === "check_in" && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-h3">Start your day</h2>
              <p className="text-body-sm text-muted-foreground">
                Check in to begin tracking your time and activity.
              </p>
            </div>
            <Button variant="accent" size="lg" onClick={handleCheckIn}>
              <LogIn size={16} />
              Check In
            </Button>
          </div>
        )}

        {state === "start_work" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-h3">Start a work session</h2>
                <p className="text-body-sm text-muted-foreground">
                  Pick a project and start tracking.
                </p>
              </div>
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 size={12} />
                Checked in
              </Badge>
            </div>
            {showProjectSelect ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    placeholder="Select a project"
                  >
                    {assignedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button onClick={handleStartWork} disabled={!selectedProject}>
                  <Play size={14} />
                  Start
                </Button>
                <Button variant="ghost" onClick={() => setShowProjectSelect(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setShowProjectSelect(true)}>
                <Play size={16} />
                Start Work
              </Button>
            )}
          </div>
        )}

        {state === "in_session" && session && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-h3">Active session</h2>
                <p className="text-body-sm text-muted-foreground">
                  {session.project?.name ?? "No project"}
                </p>
              </div>
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 size={12} />
                Checked in
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-accent/5 border border-accent/10 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-xl bg-accent/10 text-accent">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-h2 font-semibold tabular-nums tracking-tight text-accent">
                    {formatElapsed(elapsedSeconds)}
                  </p>
                  <p className="text-caption text-muted-foreground">elapsed</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleEndSession}>
                <Square size={14} />
                End Session
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3">Today&rsquo;s Activity</h2>
          {activity.length > 0 && (
            <span className="text-caption text-muted-foreground">
              {activity.length} events
            </span>
          )}
        </div>
        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-10 text-center">
            <p className="text-body-sm text-muted-foreground">
              No activity recorded yet today.
            </p>
          </div>
        ) : (
          <HorizontalScroller>
            {activity.map((event) => (
              <div
                key={event.id}
                className="w-56 shrink-0 rounded-xl border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center gap-2 text-caption text-muted-foreground mb-2">
                  {activityIcon(event.type)}
                  <span className="capitalize">
                    {event.type.toLowerCase().replace(/_/g, " ")}
                  </span>
                  <span className="ml-auto">{formatActivityTime(event.timestamp)}</span>
                </div>
                <p className="text-body-sm leading-snug line-clamp-2">
                  {event.payload && typeof event.payload === "object" && "message" in event.payload
                    ? String(event.payload.message)
                    : JSON.stringify(event.payload)}
                </p>
                <p className="text-caption text-muted-foreground mt-2 truncate">
                  {session?.project?.name ?? ""}
                </p>
              </div>
            ))}
          </HorizontalScroller>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border bg-card p-5 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-h3">Daily Summary</h3>
            <p className="text-body-sm text-muted-foreground">
              {todaySummary
                ? todaySummary.status === "APPROVED"
                  ? "Your summary has been approved."
                  : "Your summary is ready for review."
                : "You haven&rsquo;t submitted your daily summary yet."}
            </p>
          </div>
          <Button
            variant={todaySummary ? "secondary" : "accent"}
            size="sm"
            onClick={() => router.push("/employee/daily-summary")}
          >
            <FileEdit size={14} />
            {todaySummary ? "Review" : "Write Summary"}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
