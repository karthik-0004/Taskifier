"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer } from "@/components/animations"
import { Plus, Sparkles, X, Save } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectCard } from "@/components/ui/project-card"
import { Dialog } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useProjects, useUsers, createProject, recommendSkills, type ProjectDTO, type ProjectAssignmentDTO } from "@/lib/api-hooks"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

const categories = ["WEB_APPLICATION", "MOBILE_APP", "AI_ML", "DEVOPS", "DATABASE", "CLOUD", "OTHER"]
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
const statuses = ["PLANNING", "NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]
const projectRoles = ["FRONTEND", "BACKEND", "FULL_STACK", "QA", "DEVOPS", "UI_UX", "DATABASE", "AI_ENGINEER", "OTHER"]

export default function ManagerProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: projectsData, loading, error, refresh } = useProjects()
  const { data: users } = useUsers()
  const [showNewModal, setShowNewModal] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [clientName, setClientName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [expectedEndDate, setExpectedEndDate] = useState("")
  const [priority, setPriority] = useState("")
  const [status, setStatus] = useState("NOT_STARTED")
  const [teamLeadId, setTeamLeadId] = useState("")
  const [maxTeamSize, setMaxTeamSize] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [budget, setBudget] = useState("")
  const [techStack, setTechStack] = useState("")
  const [requiredSkills, setRequiredSkills] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [docsUrl, setDocsUrl] = useState("")
  const [tags, setTags] = useState("")
  const [assignments, setAssignments] = useState<Array<{
    employeeId: string
    role: string
    workload: string
    joiningDate: string
  }>>([])
  const [aiSkills, setAiSkills] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ id: string; name: string; email: string; position: string | null; skills: string | null; matchCount: number; matchPercent: number }>>([])

  const employees = (users ?? []).filter((u) => u.role === "EMPLOYEE")

  useEffect(() => {
    if (error) toast(error, "error")
  }, [error, toast])

  function autoGenerateCode() {
    if (!name.trim()) return
    const prefix = name.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).map((w) => w.charAt(0).toUpperCase()).join("").slice(0, 5)
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    setCode(`${prefix}-${suffix}`)
  }

  function positionToRole(position: string | null | undefined): string {
    if (!position) return "OTHER"
    const map: Record<string, string> = {
      "Developer": "BACKEND",
      "Tester": "QA",
      "Designer": "UI_UX",
      "DevOps": "DEVOPS",
      "Product Manager": "OTHER",
    }
    return map[position] ?? "OTHER"
  }

  function rebalanceWorkload(list: typeof assignments): typeof assignments {
    const filled = list.filter((a) => a.employeeId)
    if (filled.length === 0) return list
    const pct = Math.round(100 / filled.length)
    const remainder = 100 - pct * filled.length
    return list.map((a, i) => {
      if (!a.employeeId) return a
      const isLast = filled.indexOf(a) === filled.length - 1
      return { ...a, workload: String(isLast ? pct + remainder : pct) }
    })
  }

  function addAssignment() {
    const next = [...assignments, { employeeId: "", role: "", workload: "", joiningDate: "" }]
    setAssignments(rebalanceWorkload(next))
  }

  function updateAssignment(index: number, field: string, value: string) {
    let updated = [...assignments]
    if (field === "employeeId") {
      const selected = employees.find((e) => e.id === value)
      updated[index].employeeId = value
      if (selected && (!updated[index].role || updated[index].role === "OTHER")) {
        updated[index].role = positionToRole(selected.position)
      }
      updated = rebalanceWorkload(updated)
    } else {
      ;(updated[index] as any)[field] = value
    }
    setAssignments(updated)
  }

  function removeAssignment(index: number) {
    const filtered = assignments.filter((_, i) => i !== index)
    setAssignments(rebalanceWorkload(filtered))
  }

  async function handleAiRecommend() {
    if (!description.trim()) {
      toast("Enter a project description first", "error")
      return
    }
    setSkillsLoading(true)
    try {
      const result = await recommendSkills(description)
      setAiSkills(result.extractedSkills)
      setAiSuggestions(result.suggestedEmployees)
      setRequiredSkills(result.extractedSkills.join(", "))
      setShowSkills(true)
    } catch (err) {
      toast(err instanceof Error ? err.message : "AI recommendation failed", "error")
    } finally {
      setSkillsLoading(false)
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast("Project title is required", "error")
      return
    }
    if (!code.trim()) autoGenerateCode()
    try {
      await createProject({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        category: (category || undefined) as any,
        clientName: clientName.trim() || undefined,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        priority: (priority || undefined) as any,
        status: status as any,
        teamLeadId: teamLeadId || undefined,
        maxTeamSize: maxTeamSize ? parseInt(maxTeamSize) : undefined,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        techStack: techStack.trim() || undefined,
        requiredSkills: requiredSkills.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        docsUrl: docsUrl.trim() || undefined,
        tags: tags.trim() || undefined,
        assignments: assignments.filter((a) => a.employeeId).map((a) => ({
          employeeId: a.employeeId,
          role: a.role || "OTHER",
          workload: a.workload ? parseInt(a.workload) : undefined,
          joiningDate: a.joiningDate || undefined,
        })),
      })
      setName(""); setCode(""); setDescription(""); setCategory(""); setClientName("")
      setStartDate(""); setExpectedEndDate(""); setPriority(""); setStatus("NOT_STARTED")
      setTeamLeadId(""); setMaxTeamSize(""); setEstimatedDuration(""); setBudget("")
      setTechStack(""); setRequiredSkills(""); setRepoUrl(""); setDocsUrl(""); setTags("")
      setAssignments([]); setAiSkills([]); setAiSuggestions([])
      setShowNewModal(false)
      refresh()
      toast("Project created successfully", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create project", "error")
    }
  }

  async function handleDeleteProject() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API}/projects/${deleteTarget.id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Failed to delete project")
      toast("Project deleted", "success")
      setDeleteTarget(null)
      refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete project", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          subtitle="Manage engineering projects across the team"
          action={
            <Button variant="accent" onClick={() => setShowNewModal(true)}>
              <Plus size={16} />
              Create Project
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
            {(projectsData ?? []).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={(id) => router.push(`/manager/projects/${id}`)}
                onEdit={(p) => toast(`Edit ${p.name} — coming soon`, "info")}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </motion.div>
        )}
      </div>

      <Dialog open={showNewModal} onClose={() => setShowNewModal(false)} title="Create Project" className="max-w-2xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <section>
            <h3 className="text-h4 font-semibold mb-3">Basic Information</h3>
            <div className="space-y-3">
              <FormField label="Project Title" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. API Gateway" />
              </FormField>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormField label="Project Code">
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Auto-generated" />
                  </FormField>
                </div>
                <Button variant="secondary" size="sm" onClick={autoGenerateCode} className="mb-0.5">Generate</Button>
              </div>
              <FormField label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project description" rows={2} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category">
                  <Select value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Select category">
                    {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </Select>
                </FormField>
                <FormField label="Client / Organization">
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Optional" />
                </FormField>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-h4 font-semibold mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="Expected End Date">
                <Input type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
              </FormField>
              <FormField label="Priority">
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Select priority">
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </Select>
              </FormField>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h4 font-semibold">Team Assignment</h3>
              <Button variant="secondary" size="sm" onClick={addAssignment}>
                <Plus size={14} /> Add Member
              </Button>
            </div>
            <div className="space-y-3">
              {assignments.map((a, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border p-3">
                  <div className="flex-1 min-w-[180px]">
                    <FormField label="Employee">
                      <Select value={a.employeeId} onChange={(e) => updateAssignment(i, "employeeId", e.target.value)} placeholder="Select employee">
                        {employees.filter((e) => !assignments.some((a2, j) => a2.employeeId === e.id && j !== i)).map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                  <div className="w-36">
                    <FormField label="Role">
                      <Select value={a.role} onChange={(e) => updateAssignment(i, "role", e.target.value)}>
                        {projectRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                      </Select>
                    </FormField>
                  </div>
                  <div className="w-24">
                    <FormField label="Workload %">
                      <Input type="number" min={1} max={100} value={a.workload} onChange={(e) => updateAssignment(i, "workload", e.target.value)} />
                    </FormField>
                  </div>
                  <div className="w-36">
                    <FormField label="Joining Date">
                      <Input type="date" value={a.joiningDate} onChange={(e) => updateAssignment(i, "joiningDate", e.target.value)} />
                    </FormField>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAssignment(i)} className="text-muted-foreground hover:text-destructive mb-0.5">
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <FormField label="Team Lead (Optional)">
                <Select value={teamLeadId} onChange={(e) => setTeamLeadId(e.target.value)} placeholder="Select team lead">
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Max Team Size">
                <Input type="number" min={1} value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} placeholder="Optional" />
              </FormField>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h4 font-semibold">Skills & Requirements</h3>
              <Button variant="secondary" size="sm" onClick={handleAiRecommend} disabled={skillsLoading}>
                <Sparkles size={14} />
                {skillsLoading ? "Analyzing..." : "AI Recommend"}
              </Button>
            </div>
            <FormField label="Required Skills">
              <Input value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="e.g. React, Node.js, Docker" />
            </FormField>
            {showSkills && !skillsLoading && (
              <div className="mt-3 space-y-2 rounded-xl border p-3">
                <div className="flex items-center gap-1 text-body-sm font-medium text-accent">
                  <Sparkles size={14} /> AI Suggestions
                </div>
                {aiSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiSkills.map((s) => <Badge key={s} variant="accent">{s}</Badge>)}
                  </div>
                )}
                {aiSuggestions.filter((s) => s.matchCount > 0).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Recommended employees:</p>
                    {aiSuggestions.filter((s) => s.matchCount > 0).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-body-sm">
                        <span>{s.name} ({s.position ?? "No position"})</span>
                        <span className="text-caption text-muted-foreground">{s.matchPercent}% match</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-h4 font-semibold mb-3">Project Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Est. Duration (days)">
                <Input type="number" min={1} value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} />
              </FormField>
              <FormField label="Budget ($)">
                <Input type="number" min={0} step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
              </FormField>
              <div className="col-span-2">
                <FormField label="Technology Stack">
                  <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="e.g. React, Node.js, PostgreSQL" />
                </FormField>
              </div>
              <FormField label="GitHub Repository URL">
                <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="Optional" />
              </FormField>
              <FormField label="Documentation Link">
                <Input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="Optional" />
              </FormField>
              <div className="col-span-2">
                <FormField label="Tags">
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. frontend, api, microservice" />
                </FormField>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-card pb-1">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              <Save size={14} /> Create Project
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will permanently remove the project and all its assignments.`}
        confirmLabel="Delete Project"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
