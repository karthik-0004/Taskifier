"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProjects, createProject } from "@/lib/api-hooks"

type ProjectStatus = "active" | "on_hold" | "completed"

function mapStatus(s: string): ProjectStatus {
  if (s === "ACTIVE") return "active"
  if (s === "PAUSED") return "on_hold"
  return "completed"
}

function statusBadge(status: ProjectStatus) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>
    case "on_hold":
      return <Badge variant="warning">On Hold</Badge>
    case "completed":
      return <Badge variant="default">Completed</Badge>
  }
}

export default function ManagerProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: projectsData, loading, error, refresh } = useProjects()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newStatus, setNewStatus] = useState<"active" | "on_hold" | "completed">("active")

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  function handleCreate() {
    if (!newName.trim()) return
    createProject(newName.trim(), newDescription.trim(), newStatus)
      .then(() => {
        setNewName("")
        setNewDescription("")
        setNewStatus("active")
        setShowNewModal(false)
        refresh()
        toast("Project created successfully", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          subtitle="All engineering projects across the team"
          action={
            <Button variant="accent" onClick={() => setShowNewModal(true)}>
              <Plus size={16} />
              New Project
            </Button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-44" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {(projectsData ?? []).map((project) => {
              const status = mapStatus(project.status)

              return (
                <motion.div key={project.id} variants={staggerItem}>
                  <Card
                    hover="lift"
                    className="cursor-pointer h-full"
                    onClick={() => router.push(`/manager/projects/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-body font-semibold">{project.name}</CardTitle>
                        {statusBadge(status)}
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                          <span className="text-caption text-muted-foreground ml-1">
                            {project.assignments.length > 4
                              ? `${project.assignments.length} assigned`
                              : project.assignments.length === 1
                                ? "1 assigned"
                                : `${project.assignments.length} assigned`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-caption text-muted-foreground">No members assigned</span>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      <Dialog open={showNewModal} onClose={() => setShowNewModal(false)} title="New Project">
        <div className="space-y-4">
          <FormField label="Project Name" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. API Gateway"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as "active" | "on_hold" | "completed")}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create Project
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
