"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Users, GitCommit, Clock, ArrowRight, BarChart3, Calendar } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProjects } from "@/lib/api-hooks"

function statusBadge(status: string) {
  const map: Record<string, { variant: "success" | "warning" | "default" | "danger" | "accent"; label: string }> = {
    PLANNING: { variant: "accent", label: "Planning" },
    NOT_STARTED: { variant: "default", label: "Not Started" },
    IN_PROGRESS: { variant: "success", label: "In Progress" },
    ON_HOLD: { variant: "warning", label: "On Hold" },
    COMPLETED: { variant: "default", label: "Completed" },
    CANCELLED: { variant: "danger", label: "Cancelled" },
  }
  const s = map[status] ?? { variant: "default" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

function getWeekRange(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export default function WeeklyReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: projectsData, loading, error } = useProjects()

  const activeProjects = (projectsData ?? []).filter((p) =>
    !["COMPLETED", "CANCELLED"].includes(p.status),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Reports"
        subtitle="AI-generated weekly engineering reports organized by project"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-44" />
          ))}
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-body text-muted-foreground">No active projects with weekly reports.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {activeProjects.map((project) => (
            <motion.div key={project.id} variants={staggerItem}>
              <Card hover="lift" className="h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold truncate">{project.name}</p>
                      <p className="text-caption font-mono text-muted-foreground">{project.code}</p>
                    </div>
                    {statusBadge(project.status)}
                  </div>

                  <div className="flex items-center gap-2 text-caption text-muted-foreground mb-4">
                    <Calendar size={12} />
                    <span>{getWeekRange()}</span>
                  </div>

                  <div className="space-y-2 flex-1 mb-4">
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Users size={12} /> Team Size</span>
                      <span className="font-medium">{project.assignments.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><GitCommit size={12} /> Total Commits</span>
                      <span className="font-medium">—</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock size={12} /> Total Hours</span>
                      <span className="font-medium">—</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-auto"
                    onClick={() => router.push(`/manager/weekly-reports/${project.id}`)}
                  >
                    View Report <ArrowRight size={12} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
