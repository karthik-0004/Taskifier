"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Calendar as CalendarIcon, Clock, Users, ExternalLink, Briefcase, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { useMyProjects } from "@/lib/api-hooks"
import { PageHeader } from "@/components/page-header"

function statusBadge(status: string) {
  const map: Record<string, { variant: "success" | "warning" | "default" | "danger" | "accent" | "outline"; label: string }> = {
    PLANNING: { variant: "accent", label: "Planning" },
    NOT_STARTED: { variant: "outline", label: "Not Started" },
    IN_PROGRESS: { variant: "success", label: "In Progress" },
    ON_HOLD: { variant: "warning", label: "On Hold" },
    COMPLETED: { variant: "default", label: "Completed" },
    CANCELLED: { variant: "danger", label: "Cancelled" },
  }
  const s = map[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function MyProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: projects, loading, error } = useMyProjects()

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="My Projects" subtitle="Projects you are assigned to" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-[280px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="My Projects" subtitle="View and manage the projects you are assigned to" />

      {(!projects || projects.length === 0) ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center bg-muted/5">
          <Briefcase size={40} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No active projects</h2>
          <p className="text-body text-muted-foreground">You haven&apos;t been assigned to any projects yet.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6"
        >
          {projects.map((project) => {
            const myAssignment = project.assignments.find((a) => a.userId === user?.id)
            const myRole = myAssignment?.role.replace(/_/g, " ") || "Member"
            
            const start = project.startDate ? new Date(project.startDate) : new Date()
            const end = project.expectedEndDate ? new Date(project.expectedEndDate) : new Date(start.getTime() + 90 * 24*60*60*1000)
            const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24))
            const passedDays = Math.max(0, (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
            const progress = Math.min(100, Math.round((passedDays / totalDays) * 100))
            const daysRemaining = Math.max(0, Math.ceil(totalDays - passedDays))

            return (
              <motion.div key={project.id} variants={staggerItem}>
                <Card className="h-full flex flex-col shadow-sm border-border/60 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-4 border-b bg-muted/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold tracking-tight">{project.name}</CardTitle>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{myRole}</p>
                      </div>
                      {statusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 flex-1 flex flex-col space-y-6">
                    
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Project Progress</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3 text-center border border-border/50">
                        <CalendarIcon size={14} className="text-muted-foreground mb-1.5 mx-auto" />
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-0.5">Remaining</span>
                        <span className="text-sm font-bold text-foreground">{daysRemaining} d</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center border border-border/50">
                        <Activity size={14} className="text-muted-foreground mb-1.5 mx-auto" />
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-0.5">Priority</span>
                        <span className="text-sm font-bold text-foreground">{project.priority || "Normal"}</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center border border-border/50">
                        <Users size={14} className="text-muted-foreground mb-1.5 mx-auto" />
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-0.5">Team</span>
                        <span className="text-sm font-bold text-foreground">{project.assignments.length}</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center border border-border/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-0.5">Timeline</span>
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, {month: 'short', day:'numeric'}) : "TBD"} - 
                          {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString(undefined, {month: 'short', day:'numeric'}) : "TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button variant="accent" className="flex-1 shadow-sm">Open Project</Button>
                      <Button variant="outline" className="flex-1 shadow-sm" onClick={() => toast(`Team size: ${p.assignments.length}. Full team view coming soon!`, "info")}>View Team</Button>
                    </div>

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
