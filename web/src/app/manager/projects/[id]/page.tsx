"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, ExternalLink, Calendar, Clock, DollarSign, Users, Tag, GitBranch, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { FormField } from "@/components/ui/form-field"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { useProject, useUsers, assignEmployeeToProjectBackend, unassignEmployeeFromProjectBackend, updateAssignment } from "@/lib/api-hooks"

const projectRoles = ["FRONTEND", "BACKEND", "FULL_STACK", "QA", "DEVOPS", "UI_UX", "DATABASE", "AI_ENGINEER", "OTHER"]

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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data: project, loading, error, refresh } = useProject(id)
  const { data: usersData } = useUsers()
  const [showAssign, setShowAssign] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedRole, setSelectedRole] = useState("OTHER")
  const [selectedWorkload, setSelectedWorkload] = useState("")
  const [selectedJoiningDate, setSelectedJoiningDate] = useState("")

  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editWorkload, setEditWorkload] = useState("")
  const [editJoiningDate, setEditJoiningDate] = useState("")

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  const allEmployees = usersData ?? []
  const assignedEmployees = project?.assignments ?? []
  const unassignedEmployees = allEmployees.filter(
    (e) => !assignedEmployees.some((a) => a.userId === e.id),
  )

  function handleAssign() {
    if (!selectedEmployeeId || !project) return
    assignEmployeeToProjectBackend(project.id, selectedEmployeeId, {
      role: selectedRole,
      workload: selectedWorkload ? parseInt(selectedWorkload) : undefined,
      joiningDate: selectedJoiningDate || undefined,
    })
      .then(() => {
        setSelectedEmployeeId("")
        setSelectedRole("OTHER")
        setSelectedWorkload("")
        setSelectedJoiningDate("")
        setShowAssign(false)
        refresh()
        toast("Employee assigned", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleUnassign(employeeId: string) {
    if (!project) return
    unassignEmployeeFromProjectBackend(project.id, employeeId)
      .then(() => {
        refresh()
        setEditingAssignment(null)
        toast("Employee unassigned", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleUpdateAssignment(employeeId: string) {
    updateAssignment(project!.id, employeeId, {
      role: editRole,
      workload: editWorkload ? parseInt(editWorkload) : undefined,
      joiningDate: editJoiningDate || undefined,
    })
      .then(() => {
        refresh()
        setEditingAssignment(null)
        toast("Assignment updated", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function startEdit(a: typeof assignedEmployees[0]) {
    setEditingAssignment(a.userId)
    setEditRole(a.role)
    setEditWorkload(a.workload?.toString() ?? "")
    setEditJoiningDate(a.joiningDate?.slice(0, 10) ?? "")
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
        <Button variant="secondary" onClick={() => router.push("/manager/projects")}>Back to Projects</Button>
      </div>
    )
  }

  const tags = project.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? []
  const techStack = project.techStack?.split(",").map((t) => t.trim()).filter(Boolean) ?? []
  const requiredSkills = project.requiredSkills?.split(",").map((t) => t.trim()).filter(Boolean) ?? []

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
              <div className="flex items-center gap-3">
                <h1 className="text-h1">{project.name}</h1>
                {statusBadge(project.status)}
              </div>
              <p className="text-caption font-mono text-muted-foreground">{project.code}</p>
              <p className="text-body text-muted-foreground max-w-xl mt-2">{project.description}</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-caption text-muted-foreground flex items-center gap-1"><Calendar size={14} /> Timeline</CardTitle></CardHeader>
            <CardContent>
              {project.startDate ? (
                <p className="text-body-sm">{new Date(project.startDate).toLocaleDateString()} – {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : "TBD"}</p>
              ) : <p className="text-body-sm text-muted-foreground">Not set</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-caption text-muted-foreground flex items-center gap-1"><Users size={14} /> Team</CardTitle></CardHeader>
            <CardContent>
              <p className="text-body-sm">{project.assignments.length} member{project.assignments.length !== 1 ? "s" : ""}{project.maxTeamSize ? ` / ${project.maxTeamSize} max` : ""}</p>
              {project.projectManager && <p className="text-caption text-muted-foreground">Manager: {project.projectManager.name}</p>}
              {project.teamLead && <p className="text-caption text-muted-foreground">Lead: {project.teamLead.name}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-caption text-muted-foreground flex items-center gap-1"><Clock size={14} /> Priority & Duration</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {priorityBadge(project.priority)}
                {project.estimatedDuration && <span className="text-body-sm">{project.estimatedDuration} days</span>}
              </div>
              {project.budget != null && <p className="text-body-sm mt-1">Budget: ${project.budget.toLocaleString()}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-caption text-muted-foreground flex items-center gap-1"><Tag size={14} /> Category</CardTitle></CardHeader>
            <CardContent>
              {project.category ? <Badge variant="accent">{project.category.replace(/_/g, " ")}</Badge> : <span className="text-body-sm text-muted-foreground">Uncategorized</span>}
              {project.clientName && <p className="text-caption text-muted-foreground mt-1">Client: {project.clientName}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Skills & Tech Stack */}
        {(requiredSkills.length > 0 || techStack.length > 0) && (
          <section>
            <h2 className="text-h3 mb-3">Skills & Technology</h2>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((s) => <Badge key={s} variant="accent">{s}</Badge>)}
              {techStack.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
            </div>
          </section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <section>
            <h2 className="text-h3 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
            </div>
          </section>
        )}

        {/* Links */}
        {(project.repoUrl || project.docsUrl) && (
          <section className="flex gap-4">
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm text-accent hover:underline">
                <GitBranch size={14} /> Repository <ExternalLink size={12} />
              </a>
            )}
            {project.docsUrl && (
              <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm text-accent hover:underline">
                <FileText size={14} /> Documentation <ExternalLink size={12} />
              </a>
            )}
          </section>
        )}

        {/* Assigned Employees */}
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
              <p className="text-body-sm text-muted-foreground">No employees assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedEmployees.map((a) => {
                const isEditing = editingAssignment === a.userId
                return (
                  <div key={a.userId} className="rounded-xl border px-4 py-3">
                    {isEditing ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar name={a.user.name} size="sm" />
                          <div>
                            <p className="text-body-sm font-medium">{a.user.name}</p>
                            <p className="text-caption text-muted-foreground">{a.user.email}</p>
                          </div>
                        </div>
                        <div className="w-32">
                          <FormField label="Role">
                            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                              {projectRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                            </Select>
                          </FormField>
                        </div>
                        <div className="w-20">
                          <FormField label="Workload %">
                            <Input type="number" min={1} max={100} value={editWorkload} onChange={(e) => setEditWorkload(e.target.value)} />
                          </FormField>
                        </div>
                        <div className="w-32">
                          <FormField label="Joining">
                            <Input type="date" value={editJoiningDate} onChange={(e) => setEditJoiningDate(e.target.value)} />
                          </FormField>
                        </div>
                        <div className="flex gap-1 mb-0.5">
                          <Button variant="secondary" size="sm" onClick={() => handleUpdateAssignment(a.userId)}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingAssignment(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.user.name} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-body-sm font-medium">{a.user.name}</p>
                              {a.role !== "OTHER" && <Badge variant="accent">{a.role.replace(/_/g, " ")}</Badge>}
                            </div>
                            <p className="text-caption text-muted-foreground">{a.user.email}</p>
                            {(a.workload || a.joiningDate) && (
                              <p className="text-caption text-muted-foreground">
                                {a.workload ? `${a.workload}% workload` : ""}
                                {a.workload && a.joiningDate ? " · " : ""}
                                {a.joiningDate ? `Joined ${new Date(a.joiningDate).toLocaleDateString()}` : ""}
                              </p>
                            )}
                            {a.user.skills && <p className="text-caption text-muted-foreground">Skills: {a.user.skills}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(a)} className="text-muted-foreground">Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleUnassign(a.userId)} className="text-muted-foreground hover:text-destructive">
                            <X size={14} /> Unassign
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={showAssign} onClose={() => setShowAssign(false)} title="Assign Employee">
        <div className="space-y-4">
          <FormField label="Employee">
            <Select value={selectedEmployeeId} onChange={(e) => {
              setSelectedEmployeeId(e.target.value)
              const emp = allEmployees.find((u) => u.id === e.target.value)
              if (emp) {
                const map: Record<string, string> = {
                  "Developer": "BACKEND", "Tester": "QA", "Designer": "UI_UX",
                  "DevOps": "DEVOPS", "Product Manager": "OTHER",
                }
                setSelectedRole(map[emp.position ?? ""] ?? "OTHER")
              }
            }} placeholder="Select an employee">
              {unassignedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} — {emp.position ?? "No position"}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Role in Project">
            <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              {projectRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Workload (%)">
              <Input type="number" min={1} max={100} value={selectedWorkload} onChange={(e) => setSelectedWorkload(e.target.value)} placeholder="e.g. 50" />
            </FormField>
            <FormField label="Joining Date">
              <Input type="date" value={selectedJoiningDate} onChange={(e) => setSelectedJoiningDate(e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedEmployeeId}>Assign</Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
