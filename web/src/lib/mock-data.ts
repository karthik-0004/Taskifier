export interface Employee {
  id: string
  name: string
  email: string
  githubConnected: boolean
  projectIds: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "on_hold"
  assignedEmployeeIds: string[]
}

export interface AttendanceRecord {
  date: string
  checkedIn: string
  checkedOut: string | null
}

export type SummaryStatus = "draft" | "approved" | "rejected"

export interface Summary {
  date: string
  status: SummaryStatus
  todayWork: string
  inProgress: string
  blockers: string
  tomorrow: string
}

export interface WeeklyReport {
  weekStart: string
  featuresCompleted: string[]
  bugsFixed: string[]
  prsMerged: number
  blockers: string[]
  upcomingWork: string[]
}

const currentEmployees: Employee[] = [
  { id: "e1", name: "Sarah Chen", email: "sarah@taskifier.com", githubConnected: true, projectIds: ["p1", "p2"] },
  { id: "e2", name: "Marcus Johnson", email: "marcus@taskifier.com", githubConnected: true, projectIds: ["p1"] },
  { id: "e3", name: "Priya Patel", email: "priya@taskifier.com", githubConnected: true, projectIds: ["p2", "p4"] },
  { id: "e4", name: "James Wilson", email: "james@taskifier.com", githubConnected: false, projectIds: ["p3"] },
  { id: "e5", name: "Emma Rodriguez", email: "emma@taskifier.com", githubConnected: true, projectIds: ["p3", "p5"] },
  { id: "e6", name: "David Kim", email: "david@taskifier.com", githubConnected: true, projectIds: ["p1", "p5"] },
  { id: "e7", name: "Lisa Thompson", email: "lisa@taskifier.com", githubConnected: false, projectIds: ["p4"] },
  { id: "e8", name: "Alex Fernandez", email: "alex@taskifier.com", githubConnected: true, projectIds: ["p2", "p3"] },
  { id: "e9", name: "Rachel Green", email: "rachel@taskifier.com", githubConnected: true, projectIds: [] },
  { id: "e10", name: "Tom Baker", email: "tom@taskifier.com", githubConnected: false, projectIds: ["p5"] },
  { id: "e11", name: "Nina Kumar", email: "nina@taskifier.com", githubConnected: true, projectIds: ["p1", "p4"] },
  { id: "e12", name: "Oscar Lee", email: "oscar@taskifier.com", githubConnected: true, projectIds: ["p2"] },
  { id: "u-emp-1", name: "Jordan Employee", email: "employee@taskifier.com", githubConnected: true, projectIds: ["p1", "p2"] },
]

const currentProjects: Project[] = [
  { id: "p1", name: "API Gateway Redesign", description: "Rewriting the core API gateway to improve throughput and reduce latency for all internal services.", status: "active", assignedEmployeeIds: ["e1", "e2", "e6", "e11"] },
  { id: "p2", name: "Dashboard UI", description: "Building the new engineering dashboard with real-time metrics, team overview, and drill-down analytics.", status: "active", assignedEmployeeIds: ["e1", "e3", "e8", "e12"] },
  { id: "p3", name: "Database Migration", description: "Migrating legacy PostgreSQL schemas to the new normalized structure with zero downtime.", status: "active", assignedEmployeeIds: ["e4", "e5", "e8"] },
  { id: "p4", name: "Notification Service", description: "Event-driven notification system supporting email, Slack, and in-app push for project events.", status: "active", assignedEmployeeIds: ["e3", "e7", "e11"] },
  { id: "p5", name: "Analytics Pipeline", description: "Real-time data pipeline processing engineering activity events into the reporting warehouse.", status: "on_hold", assignedEmployeeIds: ["e5", "e6", "e10"] },
  { id: "p6", name: "Auth Module", description: "OAuth 2.0 / OpenID Connect authentication service with SSO support and role-based access.", status: "active", assignedEmployeeIds: [] },
  { id: "p7", name: "Reporting Engine", description: "Schedulable report generation engine supporting PDF, CSV exports and automated weekly digests.", status: "active", assignedEmployeeIds: [] },
  { id: "p8", name: "CLI Tools", description: "Developer CLI for managing tasks, viewing summaries, and interacting with the platform from the terminal.", status: "completed", assignedEmployeeIds: [] },
]

const attendanceHistory: Record<string, AttendanceRecord[]> = {
  e1: [
    { date: "2026-07-23", checkedIn: "08:12", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:05", checkedOut: "17:30" },
    { date: "2026-07-21", checkedIn: "08:20", checkedOut: "17:45" },
    { date: "2026-07-20", checkedIn: "08:00", checkedOut: "17:15" },
    { date: "2026-07-19", checkedIn: "08:10", checkedOut: "16:50" },
  ],
  e2: [
    { date: "2026-07-23", checkedIn: "08:30", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:35", checkedOut: "17:20" },
    { date: "2026-07-21", checkedIn: "08:15", checkedOut: "17:10" },
  ],
  e3: [
    { date: "2026-07-23", checkedIn: "07:45", checkedOut: null },
    { date: "2026-07-22", checkedIn: "07:50", checkedOut: "17:00" },
    { date: "2026-07-21", checkedIn: "07:40", checkedOut: "17:30" },
    { date: "2026-07-20", checkedIn: "08:05", checkedOut: "16:45" },
  ],
  e4: [
    { date: "2026-07-23", checkedIn: "09:10", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:55", checkedOut: "18:00" },
    { date: "2026-07-21", checkedIn: "09:00", checkedOut: "17:40" },
  ],
  e5: [
    { date: "2026-07-23", checkedIn: "08:55", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:30", checkedOut: "17:20" },
    { date: "2026-07-21", checkedIn: "08:45", checkedOut: "17:10" },
    { date: "2026-07-20", checkedIn: "09:15", checkedOut: "18:00" },
  ],
  e6: [
    { date: "2026-07-23", checkedIn: "09:20", checkedOut: "17:45" },
    { date: "2026-07-22", checkedIn: "09:00", checkedOut: "18:00" },
    { date: "2026-07-21", checkedIn: "09:10", checkedOut: "18:15" },
    { date: "2026-07-20", checkedIn: "08:50", checkedOut: "17:30" },
  ],
  e7: [
    { date: "2026-07-23", checkedIn: "08:00", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:10", checkedOut: "16:30" },
  ],
  e8: [
    { date: "2026-07-23", checkedIn: "07:55", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:00", checkedOut: "17:50" },
    { date: "2026-07-21", checkedIn: "07:50", checkedOut: "17:15" },
  ],
  e9: [
    { date: "2026-07-23", checkedIn: "09:30", checkedOut: null },
    { date: "2026-07-22", checkedIn: "09:15", checkedOut: "17:35" },
  ],
  e10: [
    { date: "2026-07-22", checkedIn: "08:25", checkedOut: "17:00" },
    { date: "2026-07-21", checkedIn: "08:20", checkedOut: "16:55" },
  ],
  e11: [
    { date: "2026-07-23", checkedIn: "08:40", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:45", checkedOut: "18:10" },
    { date: "2026-07-21", checkedIn: "08:30", checkedOut: "17:45" },
  ],
  e12: [
    { date: "2026-07-23", checkedIn: "09:05", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:50", checkedOut: "17:25" },
    { date: "2026-07-21", checkedIn: "09:00", checkedOut: "17:30" },
  ],
  "u-emp-1": [
    { date: "2026-07-23", checkedIn: "08:45", checkedOut: null },
    { date: "2026-07-22", checkedIn: "08:30", checkedOut: "17:15" },
    { date: "2026-07-21", checkedIn: "08:50", checkedOut: "17:40" },
    { date: "2026-07-20", checkedIn: "09:00", checkedOut: "18:00" },
    { date: "2026-07-19", checkedIn: "08:15", checkedOut: "16:45" },
  ],
}

const summaryHistory: Record<string, Summary[]> = {
  e1: [
    { date: "2026-07-23", status: "approved", todayWork: "Completed the rate limiting middleware for the API gateway. Added configurable thresholds per endpoint and integrated Redis-backed counters for distributed rate tracking.", inProgress: "Working on request deduplication layer to prevent duplicate writes during retry storms.", blockers: "None", tomorrow: "Start on the circuit breaker module. Need to finalize failure threshold tolerances with the infrastructure team." },
    { date: "2026-07-22", status: "approved", todayWork: "Refactored the core routing engine to support wildcard patterns. All existing routes migrated and tested with 100% coverage.", inProgress: "Rate limiting middleware — implemented the token bucket algorithm, need to add Redis persistence layer.", blockers: "Awaiting infrastructure team to provision Redis cluster access for staging environment.", tomorrow: "Complete Redis integration for rate limiter and begin deduplication layer design." },
    { date: "2026-07-21", status: "approved", todayWork: "Debugged production issue with request timeout spikes. Root cause was connection pool exhaustion under burst load. Fixed pool sizing configuration.", inProgress: "Writing integration tests for the routing refactor. 85% coverage achieved so far.", blockers: "None", tomorrow: "Finish integration tests and begin routing engine performance benchmarks." },
    { date: "2026-07-20", status: "rejected", todayWork: "Wrote integration tests for the new routing layer.", inProgress: "Continuing routing layer work.", blockers: "None", tomorrow: "Continue tests" },
    { date: "2026-07-17", status: "approved", todayWork: "Shipped the health check endpoint with detailed service dependency status. Deployed to production.", inProgress: "Designing the circuit breaker API contract for the gateway.", blockers: "None", tomorrow: "Finalize circuit breaker design doc and share with team for review." },
    { date: "2026-07-16", status: "approved", todayWork: "Set up the monitoring dashboard for gateway metrics: request latency percentiles, error rates, and throughput. Integrated with existing Grafana stack.", inProgress: "Health check endpoint — adding database connection pool health probe.", blockers: "None", tomorrow: "Complete health check probes for all downstream services." },
  ],
  e3: [
    { date: "2026-07-23", status: "approved", todayWork: "Implemented the real-time metrics hook for the dashboard. Live-updating charts with configurable refresh intervals (5s, 15s, 30s).", inProgress: "Building the team overview widget — showing active members, current projects, and daily activity summary.", blockers: "Need design sign-off on the widget layout before proceeding with polish.", tomorrow: "Complete team overview widget and begin work on the drill-down analytics panel." },
    { date: "2026-07-22", status: "approved", todayWork: "Designed the new dashboard wireframes for team overview and drill-down views. Presented to product team — received positive feedback.", inProgress: "Implementing the real-time metrics hook using Server-Sent Events for live data push. POC complete, now refining edge cases.", blockers: "None", tomorrow: "Integrate SSE hook with the backend metrics endpoint and build the overview widget." },
    { date: "2026-07-21", status: "approved", todayWork: "Set up the Recharts library integration and built the initial chart components (line, bar, area variants) following the design system.", inProgress: "Building the team overview widget layout — wireframing the component hierarchy.", blockers: "None", tomorrow: "Continue widget development and start on the SSE integration for live data." },
  ],
  e5: [
    { date: "2026-07-23", status: "approved", todayWork: "Optimized the event batch writer to handle 3x throughput. Rewrote the flush mechanism to use concurrent batch writes instead of sequential.", inProgress: "Adding dead-letter queue support for failed event batches to prevent data loss during pipeline backpressure.", blockers: "None", tomorrow: "Set up monitoring alerts for pipeline lag and dead-letter queue depth." },
    { date: "2026-07-22", status: "approved", todayWork: "Processed the accumulated pipeline backlog from the weekend spike. Identified and fixed a race condition in the batch sequencer.", inProgress: "Optimizing the event batch writer — profiling shows contention on the write lock. Exploring lock-free alternatives.", blockers: "None", tomorrow: "Implement lock-free batch writer and run comparative benchmarks." },
  ],
  e6: [
    { date: "2026-07-23", status: "approved", todayWork: "Implemented the OAuth token refresh flow with automatic retry logic. Added proper error handling for expired refresh tokens.", inProgress: "Adding client credentials grant type support for machine-to-machine authentication.", blockers: "None", tomorrow: "Complete client credentials flow and write integration tests for both grant types." },
    { date: "2026-07-22", status: "approved", todayWork: "Implemented the OAuth token refresh flow for the auth module. Handles concurrent refresh requests gracefully using a shared promise queue.", inProgress: "Adding client credentials grant type for service accounts. Setting up the validation chain.", blockers: "Waiting for security review of the token rotation strategy before proceeding.", tomorrow: "Address security review feedback and continue client credentials implementation." },
    { date: "2026-07-21", status: "draft", todayWork: "Set up the auth module database schema and migration scripts.", inProgress: "Started on the OAuth token refresh implementation.", blockers: "None", tomorrow: "Continue OAuth implementation." },
  ],
  e8: [
    { date: "2026-07-23", status: "approved", todayWork: "Completed the migration script for the legacy schema. Ran dry-run against staging — no data integrity issues detected.", inProgress: "Writing rollback procedures for each migration phase to ensure safe reversions.", blockers: "None", tomorrow: "Schedule the first migration window with the operations team and prepare runbook." },
    { date: "2026-07-22", status: "approved", todayWork: "Successfully migrated the users and projects tables to the new schema in staging. Performance improved 40% on complex queries.", inProgress: "Writing the automated rollback scripts for each migration phase — critical for the production cutover plan.", blockers: "None", tomorrow: "Continue rollback scripts and plan the production migration schedule." },
  ],
  e11: [
    { date: "2026-07-23", status: "approved", todayWork: "Set up the notification delivery pipeline for the Notification Service. Slack and email channels are now routing correctly.", inProgress: "Implementing the in-app notification center with read/unread state and real-time delivery via WebSocket.", blockers: "None", tomorrow: "Continue in-app notification center — focus on the WebSocket integration layer." },
    { date: "2026-07-22", status: "approved", todayWork: "Configured the Slack notification templates and verified webhook delivery. Added retry logic for failed deliveries.", inProgress: "Working on the email notification channel using the transactional email service. Template rendering is complete.", blockers: "Need access to the email service staging environment to test delivery.", tomorrow: "Test email delivery in staging and begin in-app notification implementation." },
  ],
  "u-emp-1": [
    { date: "2026-07-23", status: "draft", todayWork: "Refactored the user list component to use the new pagination API. Added loading states and error boundaries.", inProgress: "Building the settings page with notification preferences and account management sections.", blockers: "None", tomorrow: "Complete settings page and start on the onboarding flow redesign." },
    { date: "2026-07-22", status: "approved", todayWork: "Fixed the sidebar navigation bug where active states weren't persisting after page reload. Added proper path matching logic.", inProgress: "Reviewing the new pagination API contract with the backend team before integration.", blockers: "None", tomorrow: "Begin pagination integration and update the user list component." },
    { date: "2026-07-21", status: "approved", todayWork: "Implemented the dark mode toggle with system preference detection. Persisted user preference to localStorage.", inProgress: "Debugging the sidebar active state issue — tracing through the route matching logic.", blockers: "None", tomorrow: "Fix sidebar active state and write tests for the dark mode toggle." },
    { date: "2026-07-20", status: "rejected", todayWork: "Started dark mode implementation. Set up CSS variable overrides.", inProgress: "Working on theme switching logic.", blockers: "None", tomorrow: "Continue dark mode work." },
  ],
}

const weeklyReports: Record<string, WeeklyReport[]> = {
  e1: [
    {
      weekStart: "2026-07-21",
      featuresCompleted: ["Rate limiting middleware with Redis-backed counters", "Wildcard pattern routing engine refactor", "Health check endpoint with service dependency probes"],
      bugsFixed: ["Production request timeout spike — connection pool sizing fix", "Route conflict resolution for overlapping patterns"],
      prsMerged: 8,
      blockers: ["Awaiting Redis cluster provisioning for rate limiter staging environment"],
      upcomingWork: ["Circuit breaker module design and implementation", "Request deduplication layer", "Gateway performance benchmarking suite"],
    },
    {
      weekStart: "2026-07-14",
      featuresCompleted: ["Monitoring dashboard for gateway metrics (latency, error rates, throughput)", "Grafana integration with existing stack"],
      bugsFixed: ["Dashboard metric aggregation query timeout optimization", "Health check false negatives during partial outages"],
      prsMerged: 6,
      blockers: [],
      upcomingWork: ["Complete health check probes for all downstream services", "Circuit breaker API contract design"],
    },
  ],
  e3: [
    {
      weekStart: "2026-07-21",
      featuresCompleted: ["Real-time metrics hook with Server-Sent Events", "Dashboard team overview widget", "Recharts component library integration"],
      bugsFixed: ["SSE connection reconnection race condition on network flaps"],
      prsMerged: 5,
      blockers: ["Design sign-off pending on widget layout"],
      upcomingWork: ["Drill-down analytics panel", "Configurable chart refresh intervals", "Dashboard export to PDF"],
    },
  ],
  e5: [
    {
      weekStart: "2026-07-21",
      featuresCompleted: ["Optimized event batch writer — 3x throughput improvement", "Dead-letter queue for failed event batches"],
      bugsFixed: ["Race condition in batch sequencer", "Pipeline backlog accumulation during traffic spikes"],
      prsMerged: 4,
      blockers: [],
      upcomingWork: ["Lock-free batch writer implementation", "Pipeline lag monitoring alerts", "Dead-letter queue depth alerts"],
    },
  ],
  e6: [
    {
      weekStart: "2026-07-21",
      featuresCompleted: ["OAuth token refresh flow with concurrent request deduplication", "Client credentials grant type for service accounts"],
      bugsFixed: ["Expired refresh token edge case handling", "Token rotation race condition"],
      prsMerged: 7,
      blockers: ["Security review pending for token rotation strategy"],
      upcomingWork: ["Integration tests for both grant types", "Authorization code flow with PKCE"],
    },
  ],
}

export interface ActivityEvent {
  id: string
  type: "commit" | "branch_switch" | "pr_open" | "review"
  project: string
  description: string
  time: string
}

const todayStr = "2026-07-23"

const activityEvents: Record<string, ActivityEvent[]> = {
  e1: [
    { id: "a1", type: "commit", project: "API Gateway Redesign", description: "feat: add rate limiting middleware token bucket", time: "09:15" },
    { id: "a2", type: "commit", project: "API Gateway Redesign", description: "fix: handle Redis connection failure gracefully", time: "10:02" },
    { id: "a3", type: "branch_switch", project: "API Gateway Redesign", description: "Switched from feat/rate-limiter to fix/redis-fallback", time: "09:45" },
    { id: "a4", type: "pr_open", project: "API Gateway Redesign", description: "PR #342 — Rate limiting middleware", time: "11:30" },
    { id: "a5", type: "review", project: "Dashboard UI", description: "Reviewed PR #338 — Real-time metrics hook", time: "14:00" },
    { id: "a6", type: "commit", project: "API Gateway Redesign", description: "test: add rate limiter integration tests", time: "14:45" },
  ],
  e2: [
    { id: "a7", type: "commit", project: "API Gateway Redesign", description: "test: add connection pool benchmark suite", time: "09:30" },
    { id: "a8", type: "branch_switch", project: "API Gateway Redesign", description: "Switched from main to test/benchmarks", time: "09:20" },
    { id: "a9", type: "commit", project: "API Gateway Redesign", description: "chore: update test dependencies", time: "10:45" },
  ],
  e3: [
    { id: "a10", type: "commit", project: "Dashboard UI", description: "feat: implement SSE real-time metrics hook", time: "08:30" },
    { id: "a11", type: "commit", project: "Dashboard UI", description: "style: polish team overview widget layout", time: "10:15" },
    { id: "a12", type: "pr_open", project: "Dashboard UI", description: "PR #345 — Real-time metrics hook + widget", time: "11:00" },
    { id: "a13", type: "branch_switch", project: "Notification Service", description: "Switched to feat/notification-templates", time: "13:30" },
    { id: "a14", type: "commit", project: "Notification Service", description: "feat: add Slack notification template renderer", time: "14:20" },
  ],
  e4: [
    { id: "a15", type: "commit", project: "Database Migration", description: "feat: add users table migration v2", time: "09:45" },
    { id: "a16", type: "commit", project: "Database Migration", description: "fix: handle NULL constraints in projects migration", time: "11:10" },
    { id: "a17", type: "branch_switch", project: "Database Migration", description: "Switched from feat/users-v2 to fix/constraints", time: "10:30" },
  ],
  e5: [
    { id: "a18", type: "commit", project: "Analytics Pipeline", description: "perf: optimize batch writer flush mechanism", time: "09:10" },
    { id: "a19", type: "commit", project: "Analytics Pipeline", description: "feat: add dead-letter queue for failed events", time: "11:30" },
    { id: "a20", type: "pr_open", project: "Analytics Pipeline", description: "PR #347 — Batch writer optimization", time: "15:00" },
  ],
  e6: [
    { id: "a21", type: "commit", project: "Auth Module", description: "feat: implement OAuth token refresh flow", time: "08:50" },
    { id: "a22", type: "branch_switch", project: "Auth Module", description: "Switched from feat/refresh-token to feat/client-creds", time: "10:30" },
    { id: "a23", type: "commit", project: "Auth Module", description: "feat: add client credentials grant type", time: "13:15" },
    { id: "a24", type: "review", project: "API Gateway Redesign", description: "Reviewed PR #342 — Rate limiting middleware", time: "14:30" },
  ],
}

let nextEmployeeId = 13
let nextProjectId = 9

export function getEmployees(): Employee[] {
  return currentEmployees
}

export function getEmployee(id: string): Employee | undefined {
  return currentEmployees.find((e) => e.id === id)
}

export function addEmployee(name: string, email: string): Employee {
  const employee: Employee = {
    id: `e${nextEmployeeId++}`,
    name,
    email,
    githubConnected: false,
    projectIds: [],
  }
  currentEmployees.push(employee)
  return employee
}

export function getEmployeeAttendance(id: string): AttendanceRecord[] {
  return attendanceHistory[id] ?? []
}

export function getEmployeeSummaries(id: string): Summary[] {
  return summaryHistory[id] ?? []
}

export function getAllApprovedSummaries(): { employeeId: string; summary: Summary }[] {
  const result: { employeeId: string; summary: Summary }[] = []
  for (const [empId, summaries] of Object.entries(summaryHistory)) {
    for (const s of summaries) {
      if (s.status === "approved") {
        result.push({ employeeId: empId, summary: s })
      }
    }
  }
  result.sort((a, b) => b.summary.date.localeCompare(a.summary.date))
  return result
}

export function getWeeklyReports(employeeId: string): WeeklyReport[] {
  return weeklyReports[employeeId] ?? []
}

export function getAllAttendanceRecords(): { employeeId: string; record: AttendanceRecord }[] {
  const result: { employeeId: string; record: AttendanceRecord }[] = []
  for (const [empId, records] of Object.entries(attendanceHistory)) {
    for (const r of records) {
      result.push({ employeeId: empId, record: r })
    }
  }
  result.sort((a, b) => b.record.date.localeCompare(a.record.date))
  return result
}

export function getTodayActivity(employeeId: string): ActivityEvent[] {
  return activityEvents[employeeId] ?? []
}

export function getTodayAttendance(employeeId: string): AttendanceRecord | undefined {
  const records = attendanceHistory[employeeId]
  if (!records) return undefined
  return records.find((r) => r.date === todayStr)
}

export function getTodaySummary(employeeId: string): Summary | undefined {
  const summaries = summaryHistory[employeeId]
  if (!summaries) return undefined
  return summaries.find((s) => s.date === todayStr)
}

export function getEmployeeSummariesWithStatus(employeeId: string, status: SummaryStatus): Summary[] {
  const summaries = summaryHistory[employeeId]
  if (!summaries) return []
  return summaries.filter((s) => s.status === status)
}

export function getProjects(): Project[] {
  return currentProjects
}

export function getProject(id: string): Project | undefined {
  return currentProjects.find((p) => p.id === id)
}

export function addProject(name: string, description: string, status: Project["status"]): Project {
  const project: Project = {
    id: `p${nextProjectId++}`,
    name,
    description,
    status,
    assignedEmployeeIds: [],
  }
  currentProjects.push(project)
  return project
}

export function assignEmployeeToProject(projectId: string, employeeId: string): void {
  const project = currentProjects.find((p) => p.id === projectId)
  const employee = currentEmployees.find((e) => e.id === employeeId)
  if (!project || !employee) return
  if (!project.assignedEmployeeIds.includes(employeeId)) {
    project.assignedEmployeeIds.push(employeeId)
  }
  if (!employee.projectIds.includes(projectId)) {
    employee.projectIds.push(projectId)
  }
}

export function unassignEmployeeFromProject(projectId: string, employeeId: string): void {
  const project = currentProjects.find((p) => p.id === projectId)
  const employee = currentEmployees.find((e) => e.id === employeeId)
  if (!project || !employee) return
  project.assignedEmployeeIds = project.assignedEmployeeIds.filter((id) => id !== employeeId)
  employee.projectIds = employee.projectIds.filter((id) => id !== projectId)
}