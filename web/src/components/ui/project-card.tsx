"use client"

import { Eye, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { staggerItem } from "@/components/animations"
import type { ProjectDTO } from "@/lib/api-hooks"

interface ProjectCardProps {
  project: ProjectDTO
  onView: (id: string) => void
  onEdit: (project: ProjectDTO) => void
  onDelete: (project: ProjectDTO) => void
}

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

function priorityBadge(priority: string | null) {
  if (!priority) return null
  const map: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
    LOW: { variant: "success", label: "Low" },
    MEDIUM: { variant: "warning", label: "Medium" },
    HIGH: { variant: "danger", label: "High" },
    CRITICAL: { variant: "danger", label: "Critical" },
  }
  const p = map[priority] ?? { variant: "default" as const, label: priority }
  return <Badge variant={p.variant}>{p.label}</Badge>
}

function projectProgress(project: ProjectDTO): number {
  if (project.status === "COMPLETED" || project.status === "CANCELLED") return 100
  if (project.status === "NOT_STARTED") return 0
  if (project.status === "PLANNING") return 10
  if (project.status === "ON_HOLD") return 25
  if (project.status === "IN_PROGRESS") {
    if (project.startDate && project.expectedEndDate) {
      const start = new Date(project.startDate).getTime()
      const end = new Date(project.expectedEndDate).getTime()
      const now = Date.now()
      if (now >= end) return 90
      if (now <= start) return 5
      return Math.round(((now - start) / (end - start)) * 70) + 15
    }
    return 50
  }
  return 0
}

export function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  const progress = projectProgress(project)

  return (
    <motion.div variants={staggerItem}>
      <Card hover="lift" className="h-full flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold truncate">{project.name}</p>
              <p className="text-caption font-mono text-muted-foreground">{project.code}</p>
            </div>
            {statusBadge(project.status)}
          </div>

          {project.description && (
            <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
          )}

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-caption text-muted-foreground">Progress</span>
              <span className="text-caption font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {priorityBadge(project.priority)}
            {project.category && <Badge variant="accent">{project.category.replace(/_/g, " ")}</Badge>}
          </div>

          <div className="flex items-center justify-between mt-auto mb-3">
            {project.assignments.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {project.assignments.slice(0, 4).map((a) => (
                    <Avatar
                      key={a.userId}
                      name={a.user.name}
                      size="sm"
                      className="ring-2 ring-card"
                    />
                  ))}
                </div>
                <span className="text-caption text-muted-foreground ml-1">{project.assignments.length} assigned</span>
              </div>
            ) : (
              <span className="text-caption text-muted-foreground">No members</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onView(project.id)}>
              <Eye size={12} /> View
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(project)}>
              <Pencil size={12} /> Edit
            </Button>
            <Button variant="destructive" size="sm" className="flex-none" onClick={() => onDelete(project)}>
              <Trash2 size={12} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
