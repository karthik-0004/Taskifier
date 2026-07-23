import { useState, useEffect, useCallback } from "react"
import { api } from "./api"

// ── Shared types ──────────────────────────────────────────────

export interface UserDTO {
  id: string
  email: string
  name: string
  phoneNumber: string | null
  position: string | null
  profilePicture: string | null
  role: string
  githubUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectAssignmentDTO {
  id: string
  userId: string
  projectId: string
  role: string
  workload: number | null
  joiningDate: string | null
  user: { id: string; name: string; email: string; role: string; position: string | null; skills: string | null }
}

export interface ProjectDTO {
  id: string
  name: string
  code: string
  description: string | null
  category: string | null
  clientName: string | null
  startDate: string | null
  expectedEndDate: string | null
  priority: string | null
  status: string
  projectManagerId: string | null
  teamLeadId: string | null
  maxTeamSize: number | null
  estimatedDuration: number | null
  budget: number | null
  techStack: string | null
  requiredSkills: string | null
  repoUrl: string | null
  docsUrl: string | null
  tags: string | null
  managerId: string
  createdAt: string
  updatedAt: string
  assignments: ProjectAssignmentDTO[]
  projectManager: { id: string; name: string; email: string } | null
  teamLead: { id: string; name: string; email: string } | null
  manager: { id: string; name: string; email: string }
}

export interface ActiveSessionDTO {
  userId: string
  userName: string
  userEmail: string
  projectName: string | null
  startedAt: string
  source: string
}

export interface DashboardDTO {
  totalActiveEmployees: number
  totalActiveProjects: number
  attendance: {
    checkedIn: Array<{ id: string; name: string; email: string; checkedInAt: string }>
    notCheckedIn: Array<{ id: string; name: string; email: string }>
  }
  summaries: { approved: number; pending: number }
  activeSessions: ActiveSessionDTO[]
}

export interface AttendanceDTO {
  id: string
  userId: string
  date: string
  checkInAt: string | null
  checkOutAt: string | null
  user: { id: string; name: string; email: string; role: string; position: string | null }
}

export interface DailySummaryDTO {
  id: string
  userId: string
  date: string
  aiGeneratedContent: string
  editedContent: string | null
  status: "DRAFT" | "APPROVED" | "REJECTED"
  approvedAt: string | null
  createdAt: string
  user?: { id: string; name: string; email: string }
}

export interface WeeklyReportDTO {
  id: string
  userId: string
  weekStart: string
  content: string
  generatedAt: string
  user?: { id: string; name: string; email: string }
}

export interface ProjectDailyEmployeeDTO {
  userId: string
  name: string
  email: string
  position: string | null
  skills: string | null
  role: string
  workload: number | null
  joiningDate: string | null
  checkIn: string | null
  checkOut: string | null
  totalMinutes: number
  commitCount: number
  fileEditCount: number
  activityEvents: Array<{ id: string; type: string; payload: Record<string, unknown>; timestamp: string }>
  summaryId: string | null
  summaryContent: string | null
  summaryStatus: string | null
}

export interface ProjectDailyDTO {
  project: {
    id: string
    name: string
    code: string
    status: string
    priority: string | null
    category: string | null
    description: string | null
    teamLead: { id: string; name: string } | null
    manager: { id: string; name: string }
    totalMembers: number
  }
  date: string
  employees: ProjectDailyEmployeeDTO[]
}

// ── Content parsers ───────────────────────────────────────────

export interface ParsedSummary {
  todayWork: string
  inProgress: string
  blockers: string
  tomorrow: string
}

export function parseSummaryContent(content: string): ParsedSummary {
  const sections: Record<string, string> = {}
  const lines = content.split("\n")
  let currentKey: string | null = null
  const currentLines: string[] = []

  for (const line of lines) {
    const headerMatch = line.match(/^(Today's Work|In Progress|Blockers|Tomorrow):\s*/i)
    if (headerMatch) {
      if (currentKey && currentLines.length > 0) {
        sections[currentKey] = currentLines.join("\n").trim()
      }
      currentKey = headerMatch[1]
      currentLines.length = 0
      const rest = line.slice(headerMatch[0].length).trim()
      if (rest) currentLines.push(rest)
    } else if (currentKey) {
      currentLines.push(line)
    }
  }
  if (currentKey && currentLines.length > 0) {
    sections[currentKey] = currentLines.join("\n").trim()
  }

  return {
    todayWork: sections["Today's Work"] ?? content,
    inProgress: sections["In Progress"] ?? "",
    blockers: sections["Blockers"] ?? "",
    tomorrow: sections["Tomorrow"] ?? "",
  }
}

export interface ParsedReport {
  featuresCompleted: string[]
  bugsFixed: string[]
  prsMerged: string
  blockers: string[]
  upcomingWork: string[]
}

function parseListSection(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
}

export function parseReportContent(content: string): ParsedReport {
  const sections: Record<string, string> = {}
  const lines = content.split("\n")
  let currentKey: string | null = null
  const currentLines: string[] = []

  for (const line of lines) {
    const headerMatch = line.match(
      /^(Features Completed|Bugs Fixed|PRs Merged|Blockers|Upcoming Work):\s*/i,
    )
    if (headerMatch) {
      if (currentKey && currentLines.length > 0) {
        sections[currentKey] = currentLines.join("\n").trim()
      }
      currentKey = headerMatch[1]
      currentLines.length = 0
      const rest = line.slice(headerMatch[0].length).trim()
      if (rest) currentLines.push(rest)
    } else if (currentKey) {
      currentLines.push(line)
    }
  }
  if (currentKey && currentLines.length > 0) {
    sections[currentKey] = currentLines.join("\n").trim()
  }

  return {
    featuresCompleted: parseListSection(sections["Features Completed"] ?? ""),
    bugsFixed: parseListSection(sections["Bugs Fixed"] ?? ""),
    prsMerged: sections["PRs Merged"] ?? "",
    blockers: parseListSection(sections["Blockers"] ?? ""),
    upcomingWork: parseListSection(sections["Upcoming Work"] ?? ""),
  }
}

// ── Generic fetch hook ────────────────────────────────────────

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = [], enabled = true): FetchState<T> & { refresh: () => void } {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: enabled, error: null })
  const [trigger, setTrigger] = useState(0)

  const refresh = useCallback(() => setTrigger((n) => n + 1), [])

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, enabled, ...deps])

  return { ...state, refresh }
}

// ── Dashboard ─────────────────────────────────────────────────

export function useDashboard() {
  return useFetch<DashboardDTO>(() => api<DashboardDTO>("/dashboard"))
}

// ── Users ─────────────────────────────────────────────────────

export function useUsers() {
  return useFetch<UserDTO[]>(() => api<UserDTO[]>("/users"))
}

export function createUser(name: string, email: string, password: string, phoneNumber?: string, position?: string) {
  return api<UserDTO>("/users", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phoneNumber, position }),
  })
}

export function deleteUser(id: string) {
  return api(`/users/${id}`, { method: "DELETE" })
}

export function updateProfile(data: { name?: string; phoneNumber?: string; position?: string; profilePicture?: string }) {
  return api<UserDTO>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function forgotPassword(email: string) {
  return api("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  })
}

export function resetPassword(token: string, newPassword: string) {
  return api("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
    skipAuth: true,
  })
}

// ── Projects ──────────────────────────────────────────────────

export function useProjects() {
  return useFetch<ProjectDTO[]>(() => api<ProjectDTO[]>("/projects"))
}

export function useMyProjects() {
  return useFetch<ProjectDTO[]>(() => api<ProjectDTO[]>("/projects/mine"))
}

export function useProject(id: string) {
  return useFetch<ProjectDTO>(() => api<ProjectDTO>(`/projects/${id}`), [id])
}

export function createProject(data: {
  name: string
  code?: string
  description?: string
  category?: string
  clientName?: string
  startDate?: string
  expectedEndDate?: string
  priority?: string
  status?: string
  teamLeadId?: string
  maxTeamSize?: number
  estimatedDuration?: number
  budget?: number
  techStack?: string
  requiredSkills?: string
  repoUrl?: string
  docsUrl?: string
  tags?: string
  assignments?: Array<{
    employeeId: string
    role?: string
    workload?: number
    joiningDate?: string
  }>
}) {
  return api<ProjectDTO>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function assignEmployeeToProjectBackend(
  projectId: string,
  employeeId: string,
  options?: { role?: string; workload?: number; joiningDate?: string },
) {
  return api<ProjectAssignmentDTO>(`/projects/${projectId}/assign`, {
    method: "POST",
    body: JSON.stringify({ employeeId, ...options }),
  })
}

export function updateAssignment(
  projectId: string,
  employeeId: string,
  data: { role?: string; workload?: number; joiningDate?: string },
) {
  return api(`/projects/${projectId}/assign/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function unassignEmployeeFromProjectBackend(projectId: string, employeeId: string) {
  return api(`/projects/${projectId}/assign/${employeeId}`, {
    method: "DELETE",
  })
}

export function recommendSkills(description: string) {
  return api<{ extractedSkills: string[]; suggestedEmployees: Array<{ id: string; name: string; email: string; position: string | null; skills: string | null; matchCount: number; matchPercent: number }> }>("/projects/recommend-skills", {
    method: "POST",
    body: JSON.stringify({ description }),
  })
}

// ── Summaries ─────────────────────────────────────────────────

export function useTeamSummaries(params?: {
  employeeId?: string
  startDate?: string
  endDate?: string
}) {
  const qs = new URLSearchParams()
  if (params?.employeeId) qs.set("employeeId", params.employeeId)
  if (params?.startDate) qs.set("startDate", params.startDate)
  if (params?.endDate) qs.set("endDate", params.endDate)
  const query = qs.toString()
  return useFetch<DailySummaryDTO[]>(
    () => api<DailySummaryDTO[]>(`/summaries/team${query ? `?${query}` : ""}`),
    [query],
  )
}

export function useEmployeeSummaries(employeeId: string) {
  return useFetch<DailySummaryDTO[]>(
    () => api<DailySummaryDTO[]>(`/summaries/employee/${employeeId}`),
    [employeeId],
    !!employeeId,
  )
}

export function useProjectDailySummary(projectId: string, date: string) {
  return useFetch<ProjectDailyDTO>(
    () => api<ProjectDailyDTO>(`/summaries/project/${projectId}?date=${date}`),
    [projectId, date],
    !!projectId && !!date,
  )
}

// ── Weekly Reports ────────────────────────────────────────────

export function useTeamReports(weekStart?: string) {
  const qs = weekStart ? `?weekStart=${weekStart}` : ""
  return useFetch<WeeklyReportDTO[]>(
    () => api<WeeklyReportDTO[]>(`/reports/weekly/team${qs}`),
    [weekStart],
  )
}

// ── Content builder for summaries ─────────────────────────────

export function buildSummaryContent(sections: ParsedSummary): string {
  const parts: string[] = []
  if (sections.todayWork) parts.push(`Today's Work:\n${sections.todayWork}`)
  if (sections.inProgress) parts.push(`In Progress:\n${sections.inProgress}`)
  if (sections.blockers) parts.push(`Blockers:\n${sections.blockers}`)
  if (sections.tomorrow) parts.push(`Tomorrow:\n${sections.tomorrow}`)
  return parts.join("\n\n")
}

// ── Sessions ──────────────────────────────────────────────────

export interface WorkSessionDTO {
  id: string
  userId: string
  projectId: string | null
  startedAt: string
  endedAt: string | null
  source: string
  project: { id: string; name: string } | null
}

export function useMyActiveSession() {
  return useFetch<WorkSessionDTO | null>(() => api<WorkSessionDTO | null>("/sessions/active"))
}

export function useMySessions() {
  return useFetch<WorkSessionDTO[]>(() => api<WorkSessionDTO[]>("/sessions/mine"))
}

export function startSession(projectId: string) {
  return api<WorkSessionDTO>("/sessions/start", {
    method: "POST",
    body: JSON.stringify({ projectId, source: "OTHER" }),
  })
}

export function endSession(sessionId: string) {
  return api<WorkSessionDTO>(`/sessions/${sessionId}/end`, { method: "POST" })
}

// ── Employee summaries ────────────────────────────────────────

export function useMySummaries() {
  return useFetch<DailySummaryDTO[]>(() => api<DailySummaryDTO[]>("/summaries/mine"))
}

export function generateSummary(date?: string) {
  const qs = date ? `?date=${date}` : ""
  return api<DailySummaryDTO>(`/summaries/generate${qs}`, { method: "POST" })
}

export function editSummary(id: string, editedContent: string) {
  return api<DailySummaryDTO>(`/summaries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ editedContent }),
  })
}

export function approveSummary(id: string) {
  return api<DailySummaryDTO>(`/summaries/${id}/approve`, { method: "POST" })
}

export function rejectSummary(id: string) {
  return api<DailySummaryDTO>(`/summaries/${id}/reject`, { method: "POST" })
}

// ── Employee Attendance ───────────────────────────────────────

export function useMyAttendance() {
  return useFetch<AttendanceDTO[]>(() => api<AttendanceDTO[]>("/attendance/me"))
}

export function checkIn() {
  return api<AttendanceDTO>("/attendance/check-in", { method: "POST" })
}

export function checkOut() {
  return api<AttendanceDTO>("/attendance/check-out", { method: "POST" })
}

// ── Activity ──────────────────────────────────────────────────

export interface ActivityEventDTO {
  id: string
  sessionId: string
  type: string
  payload: Record<string, unknown>
  timestamp: string
}

export function useSessionActivity(sessionId: string | null) {
  return useFetch<ActivityEventDTO[]>(
    () =>
      sessionId
        ? api<ActivityEventDTO[]>(`/activity/session/${sessionId}`)
        : Promise.resolve([]),
    [sessionId],
  )
}

// ── Attendance ────────────────────────────────────────────────

export function useAttendance(params?: {
  startDate?: string
  endDate?: string
  employeeId?: string
}) {
  const qs = new URLSearchParams()
  if (params?.startDate) qs.set("startDate", params.startDate)
  if (params?.endDate) qs.set("endDate", params.endDate)
  if (params?.employeeId) qs.set("employeeId", params.employeeId)
  const query = qs.toString()
  return useFetch<AttendanceDTO[]>(
    () => api<AttendanceDTO[]>(`/attendance${query ? `?${query}` : ""}`),
    [query],
  )
}
