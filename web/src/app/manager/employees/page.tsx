"use client"

import { useState, useEffect } from "react"
import { Plus, GitBranch, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { DataTable, type Column } from "@/components/data-table"
import { Dialog } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Drawer } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useUsers, useProjects, useAttendance, useEmployeeSummaries, createUser, deleteUser, type UserDTO, type ProjectDTO, parseSummaryContent } from "@/lib/api-hooks"

interface EmployeeRow {
  id: string
  name: string
  email: string
  githubConnected: boolean
  projectIds: string[]
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

const columns: Column<EmployeeRow>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.name} size="sm" />
        <span className="font-medium text-foreground">{row.name}</span>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    render: (row) => <span className="text-muted-foreground">{row.email}</span>,
  },
  {
    key: "projectIds",
    header: "Projects",
    sortable: false,
    render: (row) => (
      <span className="text-muted-foreground">{row.projectIds.length}</span>
    ),
  },
  {
    key: "githubConnected",
    header: "GitHub",
    sortable: true,
    render: (row) =>
      row.githubConnected ? (
        <span className="inline-flex items-center gap-1.5 text-body-sm text-success">
          <CheckCircle2 size={14} />
          Connected
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <XCircle size={14} />
          Not connected
        </span>
      ),
  },
]

function employeeToRow(u: UserDTO, projects: ProjectDTO[]): EmployeeRow {
  const assignedProjectIds = projects
    .filter((p) => p.assignments.some((a) => a.userId === u.id))
    .map((p) => p.id)
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    githubConnected: u.githubUsername !== null,
    projectIds: assignedProjectIds,
  }
}

function getEmployeeProjects(employeeId: string, projects: ProjectDTO[]): ProjectDTO[] {
  return projects.filter((p) => p.assignments.some((a) => a.userId === employeeId))
}

export default function EmployeesPage() {
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
    if (showAddModal) {
      setGeneratedPassword(generateTempPassword())
    }
  }, [showAddModal])

  const employees: EmployeeRow[] = (usersData ?? []).map((u) =>
    employeeToRow(u, projectsData ?? []),
  )
  const selectedEmployee = usersData?.find((u) => u.id === selectedId) ?? null
  const selectedProjects = selectedId ? getEmployeeProjects(selectedId, projectsData ?? []) : []

  const resolvedPosition = newPosition === "Other" ? newCustomPosition.trim() : newPosition.trim()

  function handleAdd() {
    if (!newName.trim() || !newEmail.trim()) {
      toast("Name and email are required", "error")
      return
    }
    createUser(newName.trim(), newEmail.trim(), generatedPassword, newPhone.trim() || undefined, resolvedPosition || undefined)
      .then(() => {
        setNewName("")
        setNewEmail("")
        setNewPhone("")
        setNewPosition("")
        setNewCustomPosition("")
        setShowAddModal(false)
        refreshUsers()
        toast(`Employee added successfully!\nEmail: ${newEmail.trim()}\nTemporary Password: ${generatedPassword}\n\nA welcome email has also been logged in the server console.`, "success")
      })
      .catch((err) => toast(err.message, "error"))
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
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={employees}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => setSelectedId(row.id)}
            rowClassName="cursor-pointer"
          />
        )}
      </div>

      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee">
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
            />
          </FormField>
          <FormField label="Email Address" required>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@company.com"
            />
          </FormField>
          <FormField label="Phone Number">
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
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
                <Input
                  value={newCustomPosition}
                  onChange={(e) => setNewCustomPosition(e.target.value)}
                  placeholder="Enter custom role title"
                />
              )}
            </div>
          </FormField>
          <FormField label="Generated Temporary Password">
            <div className="flex gap-2">
              <Input
                value={generatedPassword}
                readOnly
                className="font-mono text-body-sm bg-muted/30"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword)
                  toast("Password copied to clipboard", "info")
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              This password will be sent to the employee via email.
            </p>
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleAdd}
              disabled={!newName.trim() || !newEmail.trim()}
            >
              Add Employee
            </Button>
          </div>
        </div>
      </Dialog>

      <EmployeeDrawer
        employee={selectedEmployee}
        projects={selectedProjects}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}

function EmployeeDrawer({
  employee,
  projects,
  onClose,
}: {
  employee: UserDTO | null
  projects: ProjectDTO[]
  onClose: () => void
}) {
  const { toast } = useToast()
  const { refresh: refreshUsers } = useUsers()
  const { data: attendanceData, loading: attendanceLoading } = useAttendance(
    employee ? { employeeId: employee.id } : undefined,
  )
  const { data: summariesData, loading: summariesLoading } = useEmployeeSummaries(
    employee?.id ?? "",
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!employee) return
    setDeleting(true)
    try {
      await deleteUser(employee.id)
      toast("Employee and all associated data deleted", "success")
      setShowDeleteConfirm(false)
      onClose()
      refreshUsers()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete employee", "error")
    } finally {
      setDeleting(false)
    }
  }

  const attendanceRecords = (attendanceData ?? []).map((a) => ({
    date: formatDate(a.date),
    checkedIn: formatTime(a.checkInAt),
    checkedOut: formatTime(a.checkOutAt),
  }))

  const approvedSummaries = (summariesData ?? [])
    .filter((s) => s.status === "APPROVED")
    .map((s) => ({
      date: formatDate(s.date),
      ...parseSummaryContent(s.editedContent ?? s.aiGeneratedContent),
    }))

  return (
    <Drawer open={!!employee} onClose={onClose} title={employee?.name}>
      {employee && (
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={employee.name} size="lg" />
              <div>
                <p className="text-body-sm text-muted-foreground">{employee.email}</p>
                {employee.githubUsername ? (
                  <span className="inline-flex items-center gap-1 text-caption text-success mt-0.5">
                    <GitBranch size={12} />
                    GitHub connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-caption text-muted-foreground mt-0.5">
                    <GitBranch size={12} />
                    Not connected
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>

          <section>
            <h3 className="text-h3 mb-3">Assigned Projects</h3>
            {projects.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">No projects assigned.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium truncate">{p.name}</p>
                    </div>
                    <Badge
                      variant={
                        p.status === "ACTIVE"
                          ? "success"
                          : p.status === "PAUSED"
                            ? "warning"
                            : "default"
                      }
                    >
                      {p.status === "ACTIVE" ? "active" : p.status === "PAUSED" ? "on hold" : "completed"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-h3 mb-3">Recent Attendance</h3>
            {attendanceLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="h-8 w-full" />
                ))}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">No attendance records.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left text-caption font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left text-caption font-medium text-muted-foreground">In</th>
                      <th className="px-3 py-2 text-left text-caption font-medium text-muted-foreground">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((rec) => (
                      <tr key={rec.date} className="border-b last:border-0">
                        <td className="px-3 py-2 text-foreground">{rec.date}</td>
                        <td className="px-3 py-2 text-muted-foreground">{rec.checkedIn ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{rec.checkedOut ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-h3 mb-3">Approved Summaries</h3>
            {summariesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="h-32 w-full" />
                ))}
              </div>
            ) : approvedSummaries.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">No approved summaries.</p>
            ) : (
              <div className="space-y-3">
                {approvedSummaries.map((s) => (
                  <div key={s.date} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-muted-foreground">{s.date}</span>
                      <Badge variant="success">Approved</Badge>
                    </div>
                    <div className="space-y-2 text-body-sm">
                      <div>
                        <span className="text-caption font-medium text-muted-foreground">Today&rsquo;s Work</span>
                        <p className="mt-0.5">{s.todayWork}</p>
                      </div>
                      <div>
                        <span className="text-caption font-medium text-muted-foreground">In Progress</span>
                        <p className="mt-0.5">{s.inProgress}</p>
                      </div>
                      {s.blockers && (
                        <div>
                          <span className="text-caption font-medium text-muted-foreground">Blockers</span>
                          <p className="mt-0.5">{s.blockers}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-caption font-medium text-muted-foreground">Tomorrow</span>
                        <p className="mt-0.5">{s.tomorrow}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employee?.name}? This will permanently remove all their data including sessions, summaries, reports, attendance records, and project assignments. This action cannot be undone.`}
        confirmLabel="Delete Employee"
        variant="danger"
        loading={deleting}
      />
    </Drawer>
  )
}
