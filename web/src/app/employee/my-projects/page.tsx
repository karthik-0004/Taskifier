"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Calendar, Clock, Users, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useMyProjects } from "@/lib/api-hooks"

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

export default function MyProjectsPage() {
  const { toast } = useToast()
  const { data: projects, loading, error } = useMyProjects()

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h1">My Projects</h1>
          <p className="text-body-sm text-muted-foreground mt-1">Projects you are assigned to</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">My Projects</h1>
        <p className="text-body-sm text-muted-foreground mt-1">Projects you are assigned to</p>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-body text-muted-foreground">You haven&apos;t been assigned to any projects yet.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {projects.map((project) => {
            const myAssignment = project.assignments.find((a) => a.role !== "OTHER")
            return (
              <motion.div key={project.id} variants={staggerItem}>
                <Card hover="lift" className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-body font-semibold">{project.name}</CardTitle>
                      {statusBadge(project.status)}
                    </div>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myAssignment && (
                      <div className="flex items-center gap-2">
                        <Badge variant="accent">{myAssignment.role.replace(/_/g, " ")}</Badge>
                        {myAssignment.workload && <span className="text-caption text-muted-foreground">{myAssignment.workload}%</span>}
                      </div>
                    )}
                    {(project.startDate || project.expectedEndDate) && (
                      <div className="flex items-center gap-1 text-caption text-muted-foreground">
                        <Calendar size={12} />
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : "?"} – {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : "TBD"}
                      </div>
                    )}
                    {project.priority && (
                      <div className="flex items-center gap-1 text-caption text-muted-foreground">
                        <Clock size={12} />
                        Priority: {project.priority}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-caption text-muted-foreground">
                      <Users size={12} />
                      {project.assignments.length} member{project.assignments.length !== 1 ? "s" : ""}
                    </div>
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-caption text-accent hover:underline">
                        <ExternalLink size={12} /> Repository
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
