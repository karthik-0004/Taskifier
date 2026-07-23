"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { FormField } from "@/components/ui/form-field"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProject, useUsers, assignEmployeeToProjectBackend, unassignEmployeeFromProjectBackend } from "@/lib/api-hooks"

function mapStatus(s: string) {
  if (s === "ACTIVE") return "active"
  if (s === "PAUSED") return "on_hold"
  return "completed"
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data: project, loading, error, refresh } = useProject(id)
  const { data: usersData } = useUsers()
  const [showAssign, setShowAssign] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const allEmployees = usersData ?? []

  const assignedEmployees = project?.assignments.map((a) => a.user) ?? []

  const unassignedEmployees = allEmployees.filter(
    (e) => !assignedEmployees.some((ae) => ae.id === e.id),
  )

  function handleAssign() {
    if (!selectedEmployeeId || !project) return
    assignEmployeeToProjectBackend(project.id, selectedEmployeeId)
      .then(() => {
        setSelectedEmployeeId("")
        setShowAssign(false)
        refresh()
        const emp = allEmployees.find((e) => e.id === selectedEmployeeId)
        toast(`Assigned ${emp?.name ?? "employee"} to ${project.name}`, "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleUnassign(employeeId: string) {
    if (!project) return
    unassignEmployeeFromProjectBackend(project.id, employeeId)
      .then(() => {
        refresh()
        const emp = allEmployees.find((e) => e.id === employeeId)
        toast(`Removed ${emp?.name ?? "employee"} from ${project.name}`, "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton variant="text" className="h-4 w-32 mb-4" />
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-96 mt-2" />
        </div>
        <Skeleton variant="rectangular" className="h-48 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-body text-muted-foreground">Project not found.</p>
        <Button variant="secondary" onClick={() => router.push("/manager/projects")}>
          Back to Projects
        </Button>
      </div>
    )
  }

  const status = mapStatus(project.status)

  return (
    <>
      <div className="space-y-8">
        <div>
          <button
            onClick={() => router.push("/manager/projects")}
            className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-h1">{project.name}</h1>
              <p className="text-body text-muted-foreground max-w-xl">
                {project.description}
              </p>
            </div>
            <Badge
              variant={
                status === "active"
                  ? "success"
                  : status === "on_hold"
                    ? "warning"
                    : "default"
              }
              className="capitalize shrink-0"
            >
              {status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3">Assigned Employees</h2>
            <Button variant="accent" size="sm" onClick={() => setShowAssign(true)}>
              <Plus size={14} />
              Assign Employee
            </Button>
          </div>

          {assignedEmployees.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center">
              <p className="text-body-sm text-muted-foreground">
                No employees assigned yet. Click &ldquo;Assign Employee&rdquo; to add someone.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} size="sm" />
                    <div>
                      <p className="text-body-sm font-medium">{emp.name}</p>
                      <p className="text-caption text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(emp.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={14} />
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Employee"
      >
        <div className="space-y-4">
          <FormField label="Employee">
            <Select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              placeholder="Select an employee"
            >
              {unassignedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.email}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAssign(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedEmployeeId}>
              Assign
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
