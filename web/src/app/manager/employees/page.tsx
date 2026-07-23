"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer } from "@/components/animations"
import { Plus, GitBranch, CheckCircle2, XCircle, Trash2, Briefcase, Mail, Calendar } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { EmployeeCard } from "@/components/ui/employee-card"
import { Dialog } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Drawer } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useUsers, useProjects, useAttendance, useEmployeeSummaries, createUser, deleteUser, type UserDTO, type ProjectDTO, parseSummaryContent } from "@/lib/api-hooks"

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

function getEmployeeProjects(employeeId: string, projects: ProjectDTO[]): ProjectDTO[] {
  return projects.filter((p) => p.assignments.some((a) => a.userId === employeeId))
}

export default function EmployeesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: usersData, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsers()
  const { data: projectsData } = useProjects()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPosition, setNewPosition] = useState("")
  const [newCustomPosition, setNewCustomPosition] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: attendanceData } = useAttendance(selectedId ? formatDate(new Date().toISOString()) : undefined)
  const { data: summariesData } = useEmployeeSummaries(selectedId ?? undefined)
  const [summaryDates, setSummaryDates] = useState<string[]>([])

  function generateTempPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$"
    let pwd = ""
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd
  }

  useEffect(() => {
    if (usersError) toast(usersError, "error")
  }, [usersError, toast])

  useEffect(() => {
    if (showAddModal) setGeneratedPassword(generateTempPassword())
  }, [showAddModal])

  useEffect(() => {
    if (summariesData) setSummaryDates(summariesData.map((s: any) => s.date))
  }, [summariesData])

  const employees = (usersData ?? []).filter((u) => u.role === "EMPLOYEE")

  function getProjectCount(userId: string): number {
    return (projectsData ?? []).filter((p) => p.assignments.some((a) => a.userId === userId)).length
  }

  const selectedEmployee = employees.find((e) => e.id === selectedId)
  const selectedProjects = selectedId ? getEmployeeProjects(selectedId, projectsData ?? []) : []
  const todayAttendance = Array.isArray(attendanceData) ? attendanceData.filter((a) => a.userId === selectedId) : []
  const employeeSummaries = summariesData ?? []

  const resolvedPosition = newPosition === "Other" ? newCustomPosition.trim() : newPosition.trim()

  function handleAdd() {
    if (!newName.trim() || !newEmail.trim()) {
      toast("Name and email are required", "error")
      return
    }
    createUser(newName.trim(), newEmail.trim(), generatedPassword, newPhone.trim() || undefined, resolvedPosition || undefined)
      .then(() => {
        setNewName(""); setNewEmail(""); setNewPhone(""); setNewPosition(""); setNewCustomPosition("")
        setShowAddModal(false)
        refreshUsers()
        toast(`Employee added successfully! Password: ${generatedPassword}`, "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      toast("Employee deleted", "success")
      setDeleteTarget(null)
      refreshUsers()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete employee", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Employees"
          subtitle="Manage your team members and their assignments"
          action={
            <Button variant="accent" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Employee
            </Button>
          }
        />

        {usersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-44" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-16 text-center">
            <p className="text-body text-muted-foreground">No employees yet. Click &ldquo;Add Employee&rdquo; to get started.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                projectCount={getProjectCount(emp.id)}
                onView={(id) => setSelectedId(id)}
                onEdit={(emp) => toast(`Edit ${emp.name} — coming soon`, "info")}
                onDelete={(emp) => setDeleteTarget(emp)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee">
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Email Address" required>
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@company.com" />
          </FormField>
          <FormField label="Phone Number">
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
          </FormField>
          <FormField label="Role">
            <div className="space-y-2">
              <select
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <option value="">Select a role</option>
                <option value="Developer">Developer</option>
                <option value="Tester">Tester</option>
                <option value="Designer">Designer</option>
                <option value="DevOps">DevOps</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Other">Other</option>
              </select>
              {newPosition === "Other" && (
                <Input value={newCustomPosition} onChange={(e) => setNewCustomPosition(e.target.value)} placeholder="Enter custom role title" />
              )}
            </div>
          </FormField>
          <FormField label="Generated Temporary Password">
            <div className="flex gap-2">
              <Input value={generatedPassword} readOnly className="font-mono text-body-sm bg-muted/30" />
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedPassword); toast("Password copied", "info") }}>
                Copy
              </Button>
            </div>
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleAdd} disabled={!newName.trim() || !newEmail.trim()}>Add Employee</Button>
          </div>
        </div>
      </Dialog>

      {/* Drawer */}
      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)}>
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name={selectedEmployee.name} size="lg" />
              <div>
                <h2 className="text-h2">{selectedEmployee.name}</h2>
                <p className="text-caption text-muted-foreground">{selectedEmployee.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-muted-foreground" />
                <span>{selectedEmployee.position ?? "No position"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span>Joined {new Date(selectedEmployee.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span>{selectedEmployee.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-muted-foreground" />
                {selectedEmployee.githubUsername ? (
                  <span className="text-success">{selectedEmployee.githubUsername}</span>
                ) : (
                  <span className="text-muted-foreground">Not connected</span>
                )}
              </div>
            </div>

            {/* Assigned Projects */}
            <section>
              <h3 className="text-h4 mb-2">Assigned Projects ({selectedProjects.length})</h3>
              {selectedProjects.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">No projects assigned.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProjects.map((p) => (
                    <div key={p.id} className="rounded-xl border px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => { setSelectedId(null); router.push(`/manager/projects/${p.id}`) }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-body-sm font-medium">{p.name}</p>
                          <p className="text-caption text-muted-foreground">{p.code}</p>
                        </div>
                        <Badge variant={p.status === "IN_PROGRESS" ? "success" : "default"}>
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Today's Attendance */}
            <section>
              <h3 className="text-h4 mb-2">Today&rsquo;s Attendance</h3>
              {todayAttendance.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">No attendance record for today.</p>
              ) : (
                <div className="space-y-1.5">
                  {todayAttendance.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border px-4 py-2">
                      <span className="text-body-sm text-muted-foreground">{formatTime(a.checkIn) ?? "—"} – {formatTime(a.checkOut) ?? "—"}</span>
                      {a.hoursWorked !== null && <Badge variant="success">{a.hoursWorked.toFixed(1)}h</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Daily Summaries */}
            <section>
              <h3 className="text-h4 mb-2">Daily Summaries</h3>
              {summaryDates.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">No summaries yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {employeeSummaries.map((s: any) => {
                    const content = parseSummaryContent(s.content)
                    return (
                      <div key={s.id} className="rounded-xl border px-4 py-2.5">
                        <p className="text-caption text-muted-foreground mb-1">{formatDate(s.date)}</p>
                        <p className="text-body-sm">{content.text}</p>
                        {content.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {content.tags.map((t: string) => <Badge key={t} variant="accent">{t}</Badge>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </Drawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will permanently remove all their data including sessions, summaries, reports, attendance records, and project assignments.`}
        confirmLabel="Delete Employee"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
