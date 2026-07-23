"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, GitBranch, Mail, Briefcase, Phone, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useUsers, useProjects } from "@/lib/api-hooks"

function statusBadge(githubConnected: boolean) {
  return githubConnected
    ? <Badge variant="success">Active</Badge>
    : <Badge variant="default">Inactive</Badge>
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data: usersData, loading, error } = useUsers()
  const { data: projectsData } = useProjects()

  if (error) toast(error, "error")

  const employee = (usersData ?? []).find((u) => u.id === id)
  const assignedProjects = (projectsData ?? []).filter((p) =>
    p.assignments.some((a) => a.userId === id),
  )
  const myAssignment = (userP: typeof projectsData[0]) =>
    userP.assignments.find((a) => a.userId === id)

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton variant="text" className="h-4 w-32 mb-4" />
        <Skeleton variant="text" className="h-8 w-72" />
        <Skeleton variant="rectangular" className="h-48 w-full" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-body text-muted-foreground">Employee not found.</p>
        <Button variant="secondary" onClick={() => router.push("/manager/employees")}>Back to Employees</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push("/manager/employees")}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Employees
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={employee.name} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h1">{employee.name}</h1>
              {statusBadge(!!employee.githubUsername)}
            </div>
            <p className="text-caption font-mono text-muted-foreground mt-1">{employee.id}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-sm font-semibold"><Mail size={14} /> Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-caption text-muted-foreground">Email</p>
              <p className="text-body-sm">{employee.email}</p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Phone</p>
              <p className="text-body-sm">{employee.phoneNumber ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-sm font-semibold"><Briefcase size={14} /> Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-caption text-muted-foreground">Position</p>
              <p className="text-body-sm">{employee.position ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Role</p>
              <p className="text-body-sm capitalize">{employee.role.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-sm font-semibold"><Calendar size={14} /> Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-caption text-muted-foreground">Joined</p>
              <p className="text-body-sm">{new Date(employee.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">GitHub</p>
              <div className="flex items-center gap-1 text-body-sm">
                <GitBranch size={12} />
                {employee.githubUsername ? (
                  <span className="text-success">{employee.githubUsername}</span>
                ) : (
                  <span className="text-muted-foreground">Not connected</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      {employee.skills && (
        <section>
          <h2 className="text-h3 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {employee.skills.split(",").map((s) => (
              <Badge key={s.trim()} variant="accent">{s.trim()}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* Assigned Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3">Assigned Projects ({assignedProjects.length})</h2>
        </div>
        {assignedProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-10 text-center">
            <p className="text-body-sm text-muted-foreground">No projects assigned.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedProjects.map((p) => {
              const a = myAssignment(p)
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => router.push(`/manager/projects/${p.id}`)}>
                  <div>
                    <p className="text-body-sm font-medium">{p.name}</p>
                    <p className="text-caption text-muted-foreground">{p.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a && a.role !== "OTHER" && <Badge variant="accent">{a.role.replace(/_/g, " ")}</Badge>}
                    <Badge variant={
                      p.status === "IN_PROGRESS" ? "success" :
                      p.status === "ON_HOLD" ? "warning" :
                      p.status === "COMPLETED" ? "default" : "default"
                    }>
                      {p.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
