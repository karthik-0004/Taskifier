# Taskifier: Technical Interview Guide

> This guide is reconstructed from the checked-in source, configuration, Prisma schema, migrations, client packages, tests, and project-status notes. It describes implementation as it exists in the repository. Claims in status documents that are not supported by executable code are marked as partial, planned, mock, or not clearly identifiable.

## 1. Project Overview

### What the project is

Taskifier is a developer productivity and engineering-work reporting system. It records developer work sessions, Git activity, attendance, employee notes, daily summaries, and weekly reports. It provides several clients for the same backend:

- A Next.js web portal for employees, managers, and a super-admin role.
- A VS Code extension for session control, Git-aware updates, summaries, and a dashboard webview.
- A terminal CLI for the same operational workflows.
- A NestJS REST API that owns authentication, business logic, persistence, and integrations.

The root package describes the backend as task and project management, while the extension describes the product as an AI-powered developer productivity assistant. Both descriptions are consistent with the implemented modules.

### Problem solved

Engineering work is distributed across IDE activity, Git commits, sessions, attendance, projects, and written updates. Taskifier centralizes those signals and turns them into reviewable daily and weekly reports. The system also gives managers project, attendance, summary, and team views, while allowing employees to submit or edit their own work summaries.

### Intended users

- **Employees/developers:** start and stop work sessions, record activity, submit notes and summaries, view assigned projects, and manage attendance.
- **Managers:** manage projects and assignments, view team attendance, review approved summaries, and generate team reports.
- **Super administrators:** the role and seed data exist, and the frontend has a dashboard route, but a complete super-admin backend feature set is not clearly identifiable from the codebase.
- **Developers using VS Code or a terminal:** use the extension or CLI as alternative clients to the web portal.

### Major implemented capabilities

1. JWT login, refresh, password change, and password reset.
2. Extension login protected by an additional per-user connection key.
3. Role and organization-permission guards.
4. Project creation, updates, assignments, generated project codes, and email notifications.
5. Work sessions with sources such as web, CLI, VS Code, and Cursor.
6. Activity events for commits, branch switches, pull requests, and file edits.
7. Attendance check-in/check-out, including automatic check-in when a session starts.
8. Employee work updates and AI enhancement of Git/manual work descriptions.
9. AI-generated daily summaries and weekly reports using OpenAI chat completions.
10. Draft, approve, reject, and edit workflow for daily summaries.
11. GitHub OAuth connection, commit retrieval, and pull-request retrieval.
12. Employee, manager, organization, dashboard, and report APIs.

### What is technically interesting

- It is a multi-client system: browser, IDE extension, and CLI all use the same REST API.
- The data model connects operational events to human-readable reporting: sessions contain events and updates, summaries aggregate a day, and weekly reports aggregate approved summaries.
- Authentication has separate browser and extension-login paths, with access and refresh JWTs.
- AI is constrained by prompts that tell the model to summarize only supplied activity and not invent outcomes.
- Prisma models capture multi-tenancy concepts, project assignments, audit-like activity events, and approval state.
- The repository also exposes realistic engineering trade-offs and unfinished edges: mock Next route handlers, incomplete migration history, plaintext client token files, and organization-scope checks that need tightening.

### What I can credibly say I implemented

The repository shows substantial implementation across the backend modules, Prisma schema, web client, extension, CLI, and supporting scripts. It does not contain authorship metadata detailed enough to attribute individual files or features to a particular person. A defensible interview statement is: **“I implemented the end-to-end Taskifier system across the NestJS API, Prisma data model, Next.js portal, VS Code extension, and CLI, including authentication, work tracking, project management, reporting, and OpenAI integration.”** Do not claim that every documented UI feature is production-backed; some are mocks or partial.

### End-to-end workflow

1. A user logs in through the web, extension, or CLI.
2. The selected client stores the returned credentials and sends the access JWT as a Bearer token.
3. The user starts a session, optionally associated with a project. The backend creates attendance for the UTC day if needed.
4. The extension or CLI can collect Git activity and submit activity events or work updates.
5. The employee submits a manual update or asks the backend to enhance commits with OpenAI.
6. The backend builds a day context from sessions, commit events, and updates, then OpenAI generates a draft daily summary.
7. The employee edits and approves the summary, or creates a manual approved summary.
8. A manager views approved summaries and can generate weekly reports from them.
9. The web dashboard presents project, attendance, session, and reporting data.

### Interview explanations

**30 seconds:**

“Taskifier is a multi-client developer productivity platform. A NestJS REST API and PostgreSQL database track projects, assignments, attendance, work sessions, Git activity, and employee updates. Employees can use a Next.js portal, VS Code extension, or CLI; the system uses OpenAI to turn structured work evidence into reviewable daily summaries and weekly reports. Managers use the web portal to oversee projects, attendance, and approved team reports.”

**1 minute:**

“The architecture has a Next.js frontend, a NestJS modular backend, and Prisma 7 over PostgreSQL. Users authenticate with access and refresh JWTs; extension and CLI login also requires a connection key. Employees start sessions from the web, extension, or CLI. Sessions can be linked to projects and contain activity events such as commits, branch switches, pull requests, and file edits. Employees can add notes, and an AI service builds a date-bounded context from those records and sends it to OpenAI with a strict summarization prompt. The generated summary is stored as a draft, then the employee can edit and approve it. Managers see approved summaries, team attendance, project assignments, and weekly reports. The main engineering concerns I would discuss are tenant scoping, secure token storage, migration consistency, and the boundary between live backend data and frontend mock routes.”

**2–3 minutes:**

“Taskifier is designed to reduce the manual effort of explaining engineering work. It has three clients: a Next.js web application, a VS Code extension, and a Node CLI. All of them call the NestJS API, although some Next route handlers are currently mock/demo endpoints. The backend is organized into modules for auth, users, projects, sessions, activity, attendance, updates, AI, summaries, reports, dashboards, organizations, email, and Prisma.

“The core data path starts with authentication. A web login checks a bcrypt hash and returns an access JWT plus a refresh JWT. The access token contains the user ID, role, organization identifiers, and organization permission keys. Passport JWT verifies the signature and reloads the user from PostgreSQL. Route guards then enforce authentication, broad roles, or permission keys. The extension path additionally checks a per-user connection key.

“Once authenticated, an employee starts a work session. The service prevents multiple active sessions, automatically checks the employee in for the UTC day, and stores the source and optional project. Activity events and work updates are attached to that session. Daily AI generation queries sessions crossing the requested day, joins projects, events, and updates, groups commits and notes by project, and sends JSON context to OpenAI. The result is stored in a DailySummary as a draft. Manual summaries are stored as approved. Approved daily summaries feed weekly report generation. Managers review the results through dashboards and team routes.

“The design is pragmatic: REST keeps the clients simple, Prisma gives typed relational access, and PostgreSQL fits the relationships and reporting queries. The main improvements I would make before production are hash reset tokens, move browser credentials to secure HttpOnly cookies, protect extension credentials with OS secret storage, add request timeouts/rate limiting, enforce organization ownership in every manager query, and reconcile the checked-in migrations with the current schema.”

## 2. Technology Stack

| Technology | Where used | Why used | Relevant alternative | Why it fits here |
|---|---|---|---|---|
| TypeScript | Nest backend, Next web app, extension | Static types across clients and services | JavaScript | Useful for DTOs, service contracts, and multi-package code |
| Node.js/npm | Backend, extension tooling, CLI | Common runtime and package ecosystem | Python or Java | One runtime covers API, tooling, and clients |
| NestJS 11 | Root backend | Modular controllers, services, guards, dependency injection | Express directly, Fastify, Spring Boot | Matches the module-oriented domain structure |
| Express adapter | Nest bootstrap | HTTP platform used by Nest | Fastify | Straightforward compatibility with Nest defaults |
| Next.js 14 / React 18 | `web/` portal | Routing, client components, server framework, React UI | Vue, Angular, plain React/Vite | Provides structured pages and a mature React ecosystem |
| Tailwind CSS | Web styling | Utility-based responsive UI | CSS modules, styled-components | Present in the web configuration and component styles |
| Framer Motion | Web animations | UI transitions and animation helpers | CSS animations | Already integrated in reusable web components |
| Lucide React and shadcn-style components | Web UI | Consistent icons and primitives | Material UI | Lightweight local component approach is already present |
| PostgreSQL | Persistent database | Relational data, constraints, joins, reporting | MongoDB or SQLite | Users, projects, assignments, sessions, summaries, and approvals are relational |
| Prisma 7 + `@prisma/adapter-pg` | Backend data access | Typed schema/client and PostgreSQL driver adapter | TypeORM, Sequelize, SQL directly | Keeps service queries typed and maps relations clearly |
| `class-validator` / `class-transformer` | Backend DTO validation | Rejects invalid and unknown request fields | Zod, Joi | Integrated with Nest `ValidationPipe` |
| Passport JWT / `@nestjs/jwt` | Auth | Bearer token extraction and signing/verifying | Server sessions, OAuth-only auth | Supports multiple stateless clients |
| bcrypt | Password service | Slow password hashing and comparison | Argon2, scrypt | Existing implementation is appropriate, though Argon2 is a possible improvement |
| OpenAI SDK | Backend AI | Chat completion generation | Anthropic, local model | Directly implemented and configurable through `OPENAI_MODEL` |
| Native `fetch` | GitHub OAuth/API | Calls OAuth and GitHub REST endpoints | Octokit | Avoids another dependency for the implemented calls |
| Nodemailer | Email service | SMTP email notifications and reset links | SendGrid, SES | Supports SMTP and a console fallback for development |
| VS Code Extension API | `extension/` | IDE dashboard, commands, status bar, webview | JetBrains plugin | Targets the stated developer workflow |
| esbuild | Extension build | Bundles TypeScript extension code | webpack, tsup | Small, fast extension bundle |
| `simple-git` | Extension and CLI | Reads local Git repositories | Git subprocesses directly | Provides a typed convenience API |
| Commander / Inquirer / Axios / Chalk | CLI | Commands, prompts, HTTP, terminal presentation | yargs, prompts, fetch | These are the configured CLI dependencies |
| `conf`, `node-notifier`, `update-notifier` | CLI | Local config, notifications, updates | Custom files, no notifier | Support a desktop-like CLI experience |
| Jest / Supertest | Backend tests | Unit and HTTP/e2e testing | Vitest, Mocha | Configured in root scripts; current coverage is narrow |
| GitHub OAuth and GitHub REST API | Backend auth/Git integration | Connect accounts and retrieve commits/PRs | GitLab, Bitbucket | Directly supports GitHub users and repositories |

No vector database, embeddings, RAG pipeline, web scraper, browser automation, Docker setup, CI/CD workflow, cloud deployment configuration, object storage, or Redis cache is identifiable in the repository. The CLI mentions multiple AI providers, but only OpenAI, OpenRouter, and Ollama have actual request paths in the CLI; Anthropic and Gemini fall back to placeholder behavior.

## 3. High-Level Architecture

```text
Employee / Manager / Developer
        |
        +--> Next.js web portal
        +--> VS Code extension
        +--> Node CLI
                    |
                    | HTTP JSON + Bearer JWT
                    v
             NestJS REST API
                    |
        Controllers -> Guards -> DTO validation -> Services
                    |
                    +--> Prisma 7 + pg adapter -> PostgreSQL
                    +--> OpenAI Chat Completions
                    +--> GitHub OAuth / REST API
                    +--> Nodemailer SMTP or console fallback
```

### Components

| Component | Responsibility | Input | Output / communication |
|---|---|---|---|
| Web portal | Role-specific employee/manager UI, forms, calendars, dashboards | User actions, stored auth state, API data | JSON requests to Nest; rendered pages and error/loading states |
| VS Code extension | IDE commands, status bar, dashboard webview, Git collection | VS Code commands, workspace Git state, prompts | REST requests; local auth file; webview messages |
| CLI | Terminal version of login, sessions, updates, summaries, local state | Shell commands, prompts, Git repository | REST requests; local profiles/session/update files |
| Nest bootstrap | Creates server, CORS, global validation, exception handling, port | Environment variables and module graph | HTTP server |
| Controllers | Map HTTP routes to authenticated service methods | Path, query, body, request user | Service results or thrown HTTP errors |
| Guards | Enforce JWT, roles, and permission metadata | Authorization header and route metadata | Allow request or return 401/403 |
| Services | Business rules and data composition | Validated DTOs and authenticated IDs | Prisma records, reports, integration results |
| Prisma/PostgreSQL | Persistent relational state and constraints | Typed queries and writes | Users, projects, sessions, events, attendance, reports |
| AI service | Builds structured context and invokes OpenAI | Work records, summaries, prompts | Generated daily/weekly/update text |
| GitHub service | OAuth connection and GitHub data retrieval | OAuth code/state, user token, repository queries | GitHub connection and commit/PR data |
| Email service | Notifications and password/project emails | Recipient and template data | SMTP message or console log |

## 4. End-to-End Data Flows

### Flow A: Web login and authenticated request

```text
Login form
 -> AuthContext.login()
 -> POST /auth/login
 -> LoginDto ValidationPipe
 -> AuthService.login()
 -> User lookup + bcrypt.compare()
 -> access JWT + refresh JWT + user metadata
 -> localStorage
 -> api() sends Authorization: Bearer <access JWT>
 -> JwtAuthGuard / Passport JWT
 -> JwtStrategy verifies signature and reloads user
 -> controller -> service -> Prisma
 -> JSON response -> React state/UI
```

The access payload contains `sub`, email, role, organization IDs, and permission keys. The refresh payload contains only `sub` and is signed with `JWT_REFRESH_SECRET`. A 401 causes the web API wrapper to call `POST /auth/refresh`; on success it retries once, and on failure clears tokens and emits `auth:logout`.

### Flow B: Start and finish a work session

1. The employee selects a project and source in the web, extension, or CLI.
2. The client calls `POST /sessions/start` with `projectId` and a `SessionSource` such as `WEB`, `VSCODE`, or `CLI`.
3. Authentication identifies the user; DTO validation checks the body.
4. `SessionsService.start` rejects another active session.
5. It finds the UTC-day attendance record. If absent, it creates attendance; if present without check-in, it fills it in. A checked-out day cannot start another session.
6. It creates `WorkSession` with start time, source, user, and optional project.
7. Activity and updates can be attached to the session.
8. `POST /sessions/:id/end` verifies the session belongs to the caller and is not already ended, then stores `endedAt`.
9. `POST /attendance/check-out` also closes any active session before setting attendance checkout fields.

### Flow C: Git/activity update to AI-enhanced work update

1. The extension or CLI reads local Git history using `simple-git`; the extension collector operates on the current workspace.
2. The client sends activity events to `POST /activity` or `/activity/bulk`, or submits a work update to `POST /updates`.
3. The backend persists event type and arbitrary structured `payload` JSON under a session.
4. For enhancement, `POST /ai/enhance-update` sends raw commits and an optional manual task to `AiService.enhanceUpdate`.
5. The service JSON-serializes the input and passes it with a prompt that preserves each commit independently, classifies common commit types, and prohibits invented work.
6. OpenAI returns text. The client or update service stores/uses it as AI-enhanced or final content.

### Flow D: Daily summary generation and approval

1. The employee requests `POST /summaries/generate` for a date.
2. `AiService.buildDayContext` queries the employee's sessions that start, end, or remain active during the UTC day, including project, activity events, and updates in that date range.
3. It groups commit messages and update notes by project and calculates completed-session minutes. Active sessions are flagged.
4. The structured JSON context is sent to OpenAI with a prompt requiring exact sections and no inference.
5. `SummariesService.generate` upserts one `DailySummary` per user/date and resets the status to `DRAFT` so new activity can be regenerated.
6. The employee can edit a draft through `PATCH /summaries/:id`, approve it through `/approve`, or reject it through `/reject`.
7. Ownership and draft status are checked before modification. Managers can read approved summaries, not drafts, through the manager-facing paths.
8. `POST /summaries/manual` creates or updates an immediately approved summary, subject to the existing non-draft conflict rule.

### Flow E: Weekly report

1. A user calls `POST /reports/weekly/generate` with a week range.
2. The report service gathers approved daily summary content for that user or team.
3. `AiService.generateWeeklySummary` labels each daily summary as a day and sends the combined text to OpenAI.
4. The model is instructed to produce features completed, bugs fixed, PRs merged, blockers, and upcoming work without adding unsupported details.
5. The result is stored in `WeeklyReport`, unique per user and week start, and returned through personal, employee, or team report routes.

## 5. Repository Structure

```text
Taskifier/
├── src/                         NestJS API
│   ├── main.ts                  Bootstrap, CORS, validation, errors
│   ├── app.module.ts            Module composition
│   ├── auth/                    Login, JWT, password reset, GitHub OAuth
│   ├── users/                   User profile and administration routes
│   ├── organization/            Organization roles and permissions
│   ├── projects/                Project CRUD and assignments
│   ├── sessions/                Work session lifecycle
│   ├── activity/                Session activity events
│   ├── attendance/              Daily check-in/out
│   ├── updates/                 Employee work updates
│   ├── summaries/               Daily summary state machine
│   ├── reports/                 Weekly reports
│   ├── dashboard/               Employee/manager aggregates
│   ├── ai/                      Context building and OpenAI calls
│   ├── email/                   SMTP/console notifications
│   ├── prisma/                  Prisma service/module
│   └── common/                  Guards, decorators, constants, filters
├── prisma/
│   ├── schema.prisma            Current relational model
│   ├── seed.ts                  Seed data
│   └── migrations/              Checked-in SQL migrations
├── web/                         Next.js 14 frontend
│   └── src/
│       ├── app/                 Pages/layouts and mock route handlers
│       ├── components/          Shell, tables, cards, dialogs, UI primitives
│       └── lib/                 API wrapper, auth context, guards, hooks
├── extension/                   VS Code extension
│   └── src/                     Commands, API, auth, Git, dashboard, status bar
├── cli/                         Node ESM CLI package
│   ├── bin/                     Executable and install hooks
│   └── src/                     API, auth, Git, commands, local utilities
├── scripts/                     API/attendance tests and data backfill
├── test/                        Nest e2e configuration/spec
├── package.json                 Backend scripts/dependencies
├── .env.example                 Environment variable names and defaults
├── prisma.config.ts             Prisma schema/migration/seed configuration
└── current_status.md             UI/product status notes, including planned items
```

### Important files

- `src/main.ts`: creates Nest, enables CORS with credentials, installs a strict global `ValidationPipe`, installs the global Prisma/HTTP exception filter, and listens on `PORT` or 3000.
- `src/app.module.ts`: imports all domain modules and global configuration.
- `src/prisma/prisma.service.ts`: creates the PostgreSQL-backed Prisma client using the pg adapter and manages lifecycle.
- `src/auth/auth.service.ts`: the actual credential, JWT, refresh, password reset, and extension-key logic.
- `src/auth/jwt.strategy.ts`: Bearer token extraction, signature verification, and user rehydration.
- `src/common/guards/`: route-level authentication, role, and permission enforcement.
- `src/ai/ai.service.ts`: date-bounded context construction and prompts.
- `src/ai/openai.service.ts`: OpenAI client initialization and chat completion request.
- `web/src/lib/api.ts`: authenticated fetch, 401 refresh/retry, and `ApiError` conversion.
- `web/src/lib/auth-context.tsx`: browser auth hydration, login, logout, and auth state.
- `extension/src/extension.ts`: extension activation and command registration.
- `extension/src/api/client.ts`: extension HTTP API and token refresh.
- `cli/src/commands/commands.js`: CLI command registration.
- `prisma/schema.prisma`: source of truth for the currently declared database model, subject to migration drift described below.

## 6. Database Deep Dive

### Database and ORM

The declared database provider is PostgreSQL. Prisma 7 is used as the ORM/client, with `@prisma/adapter-pg` and the `pg` driver. The connection is read from `DATABASE_URL` through `prisma.config.ts`. PostgreSQL is a strong fit because the system has foreign keys, unique constraints, many-to-many assignments, reporting joins, and approval states.

### Entity relationships

```text
Organization 1 ----- * User * ----- 1 OrganizationRole
                              \
                               1 ----- 1 GithubConnection
                               1 ----- * WorkSession * ----- 0..1 Project
                               1 ----- * Attendance
                               1 ----- * DailySummary
                               1 ----- * WeeklyReport
                               1 ----- * WorkUpdate * ----- 0..1 WorkSession

User * ----- * Project
      through ProjectAssignment

WorkSession 1 ----- * ActivityEvent
OrganizationRole 1 ----- * OrganizationRolePermission
Organization 1 ----- * OrganizationRole
Project 1 ----- * ProjectAssignment
Project 1 ----- * WorkSession
```

### Models, keys, and important fields

| Model | Meaning and important fields | Constraints/relations |
|---|---|---|
| `User` | Identity, email, bcrypt `passwordHash`, name, profile fields, global `role`, organization IDs, optional reset token/expiry, comma/string `skills`, GitHub username | UUID primary key; unique email and connection key; belongs optionally to organization and organization role; owns sessions, attendance, summaries, reports, updates; has three project relations for assignments, manager, lead, creator |
| `Organization` | Tenant/company name, `ACTIVE`/`SUSPENDED` status, creation time, optional creator ID scalar | UUID primary key; one-to-many users and roles. `createdBySuperAdminId` is not declared as a foreign-key relation in the current schema |
| `OrganizationRole` | Organization-specific role name and owner flag | UUID primary key; unique `(organizationId, name)`; belongs to organization; has users and permissions; cascade delete from organization |
| `OrganizationRolePermission` | A permission key assigned to an organization role | UUID primary key; unique `(organizationRoleId, permissionKey)`; cascade delete from role |
| `Project` | Name/code, description/client, dates, status, priority/category, manager/team lead, team size, duration/budget, technology/skills/repo/docs/tags | UUID primary key; unique code; manager creator is required; manager/team-lead deletion uses `SetNull`; assignments and sessions are related |
| `ProjectAssignment` | User-project join plus role, workload, joining date | UUID primary key; unique `(userId, projectId)`; user/project deletion cascades |
| `GithubConnection` | One user's access token, GitHub username, connection time | UUID primary key; unique user ID; user deletion cascades |
| `WorkSession` | User, optional project, start/end, source enum | UUID primary key; user delete cascades; project delete sets project ID null; has activity events and updates |
| `ActivityEvent` | Session event type and flexible JSON payload, timestamp | UUID primary key; session delete cascades |
| `DailySummary` | User/date, AI content, optional edited content, draft/approved/rejected status, approval time | UUID primary key; unique `(userId, date)`; user deletion cascades |
| `WeeklyReport` | User/week start/content/generated time | UUID primary key; unique `(userId, weekStart)`; user deletion cascades |
| `Attendance` | User/date and check-in/out timestamps and sources | UUID primary key; unique `(userId, date)`; user deletion cascades |
| `WorkUpdate` | User, optional session, raw commits JSON, manual note, AI content, final content, creation time | UUID primary key; user deletion cascades; session deletion sets session ID null |

Enums include `Role`, `OrganizationStatus`, `ProjectStatus`, `ProjectPriority`, `ProjectCategory`, `SessionSource`, `ActivityType`, and `SummaryStatus`. The current schema has no explicit secondary `@@index` declarations; primary keys, unique fields, and composite unique constraints create indexes. At scale, indexes on common filters such as session `(userId, startedAt)`, event `(sessionId, timestamp)`, summaries `(status, date)`, attendance `(date, userId)`, and assignments `(projectId)` would be candidates, subject to query-plan measurement.

### Normalization and design decisions

The core entities are normalized: users, projects, assignments, sessions, events, attendance, summaries, and reports are separate. `ProjectAssignment` correctly represents many-to-many membership with relationship attributes. JSON is used intentionally for event payloads and raw commit collections because event shape varies by activity type. Skills, tags, tech stack, and required skills are stored as strings rather than normalized child tables, which simplifies the MVP but makes filtering, validation, and skill matching less robust.

### Queries and transactions

Services use Prisma `findUnique`, `findFirst`, `findMany`, `create`, `update`, `upsert`, and `delete`, mostly with relation includes and selective projections. The code does not show explicit `$transaction` usage. Starting a session performs attendance creation/update followed by session creation as separate operations, so a partial failure could leave attendance without a session. Check-out similarly updates the active session and attendance separately. A production hardening step would make coupled state transitions transactional and enforce race-resistant uniqueness/active-session rules.

### Migration caveat

Two migrations are checked in: the initial migration and `add_employee_fields`. The current `schema.prisma` contains more fields/enums/models than the visible migration SQL, including organization roles, connection keys, work updates, and newer project fields. That is migration drift unless the target database was changed outside the committed migration history. In an interview, say the schema is the current declared model, but migration reproducibility needs verification before deployment.

## 7. Authentication and Authorization

### Implemented flow

**Registration:** A public registration flow is not clearly identifiable in the inspected controllers. User creation exists under user administration and seed/setup code, but the repository does not establish a public self-registration endpoint.

**Password handling:** Passwords are processed by `PasswordService`, which uses bcrypt hash and compare operations. The database stores `passwordHash`, not the plaintext password. Login returns the same generic invalid-credentials message for missing users and wrong passwords.

**Web login:** `POST /auth/login` looks up the user and organization-role permissions, compares the password, signs an access JWT with the configured `JWT_SECRET`, and signs a refresh JWT with `JWT_REFRESH_SECRET`. The web app stores both JWTs and a reduced user object in `localStorage`.

**Extension login:** `POST /auth/extension-login` performs the same password check and additionally compares the supplied `connectionKey` to the user's database value. It returns tokens plus employee and organization metadata. The extension and CLI use a shared `~/.taskifier-auth.json` file.

**Token structure:**

- Header: JWT algorithm/type metadata generated by the JWT library.
- Access payload: `sub` user ID, email, global role, organization ID, organization role ID, and `permissionKeys`.
- Refresh payload: `sub` only.
- Signature: access token uses `JWT_SECRET`; refresh verification/signing uses `JWT_REFRESH_SECRET`.

The exact JWT algorithm is library default and is not explicitly selected in source. The access token is configured through `JwtModule` and the strategy; refresh creation hard-codes `7d`. `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` exist in `.env.example`, but the service visibly hard-codes the refresh duration and the access module configuration should be treated as the source of its actual expiration.

**Verification:** `JwtAuthGuard` invokes Passport. `JwtStrategy` extracts `Authorization: Bearer`, verifies the access signature, loads the user by `payload.sub`, and returns a request user object. It does not merely trust all payload identity fields: it confirms that the user still exists, while organization and permission values are taken from the signed payload.

**Authorization:**

- `RolesGuard` checks route metadata against `SUPER_ADMIN`, `MANAGER`, or `EMPLOYEE`.
- `PermissionsGuard` checks that every required permission key is present in `request.user.permissionKeys`.
- Controller decorators define protected routes and required roles/permissions.
- The frontend also has client-side route guards and role-based layouts, but those are UX controls; backend guards are the security boundary.

**Refresh/logout:** The web client refreshes access tokens after a 401 and retries the original request. The backend refresh endpoint returns a new access token, not a new refresh token. There is no server-side refresh-token revocation or token blacklist visible. Logout is client-side deletion of stored credentials; there is no backend logout route in the inspected auth controller.

**Password reset:** `forgot-password` creates a random 32-byte hex token, stores it directly with a one-hour expiry, and emails a reset link. `reset-password` finds the unexpired token, replaces the bcrypt hash, then clears the reset token fields. The response intentionally does not reveal whether an email exists.

### Implemented versus interview concepts

| Topic | Implemented in Taskifier | Interview distinction |
|---|---|---|
| Stateless auth | Signed JWT access/refresh tokens | Easy horizontal scaling, but revocation is harder |
| HttpOnly cookies | No; web stores JWTs in localStorage | HttpOnly, Secure, SameSite cookies reduce JavaScript token theft and change CSRF trade-offs |
| Token expiration | Access/refresh expiration exists | Short access lifetime limits exposure; refresh rotation/revocation would improve control |
| Refresh rotation | No visible rotation | Rotate and revoke refresh tokens in production |
| CSRF defense | No explicit CSRF mechanism visible | Bearer headers are not automatically sent cross-site; cookie auth would require CSRF protection |
| XSS defense | Framework escaping is expected, but token storage is exposed to same-origin JavaScript | Strong CSP, output encoding, dependency hygiene, and HttpOnly cookies reduce impact |
| Roles | Global role guard | Role checks do not replace tenant/resource ownership checks |
| Fine-grained permissions | Organization role permission keys in JWT | Permission changes do not affect existing tokens until refresh/new login |

### Main authentication risks and improvements

- Browser JWTs in `localStorage` are readable by injected JavaScript; use secure HttpOnly cookies or a short-lived in-memory access token with a protected refresh mechanism.
- CLI/extension tokens are written to plaintext JSON; use the VS Code SecretStorage API and an OS keychain for CLI credentials, with restrictive file permissions as a minimum.
- Reset tokens are stored plaintext; store a hash of the token and compare its hash on reset.
- GitHub access tokens are stored plaintext in `GithubConnection`; encrypt at rest or use a token vault, and request the minimum OAuth scopes.
- Password reset and login endpoints need rate limiting and monitoring.
- Permission keys in long-lived access tokens can become stale; reload critical permissions or use short access lifetimes.
- Verify that all protected routes include both authentication and appropriate ownership/organization checks.

## 8. Core Business Logic

### Work-session and attendance rules

- At most one active session is allowed per user by service-level lookup.
- Starting a session auto-checks in for the UTC calendar day.
- A user cannot start after checking out for that day.
- Check-out requires check-in and closes one active session.
- Attendance is unique per user/date; source records whether the event came from web, CLI, VS Code, or another client.

The business invariant is useful but not fully race-proof without a database constraint or transaction around concurrent starts.

### Project management

Project codes are either supplied or generated from initials plus a random four-character suffix. Project creation can create assignments in the same Prisma create operation. If an assignment role is missing, a position-to-role mapping supplies values such as Developer -> BACKEND and Tester -> QA. Assignment uniqueness is enforced by `(userId, projectId)`. Project changes are diffed for selected fields and email notifications are sent to assigned employees. Skill recommendations are not AI: the service performs case-insensitive substring matching against a fixed common-skill list, then scores employees by matching comma-separated skills.

### Summary state machine

```text
AI generate -> DRAFT -> edit -> DRAFT
                         |-> approve -> APPROVED
                         |-> reject  -> REJECTED

Manual create -> APPROVED
```

The unique `(userId, date)` constraint makes generation idempotent at the record level through `upsert`. Regeneration intentionally resets the status to draft. Managers see approved summaries in team views. The code's manager check for an individual summary is role-based and should be paired with organization/resource ownership checks.

### Dashboard/report aggregation

Dashboard services compose counts and recent data for manager and employee views. Project daily summary logic joins project assignments to attendance, summaries, sessions, and activity events, then calculates minutes and event counts in application code. This is clear and flexible for an MVP, but large teams would need pagination, aggregate SQL, indexes, and possibly precomputed reporting tables.

### Complexity and edge cases

- Most direct Prisma lookups are approximately indexed lookup complexity, but relation includes and list queries grow with users/events/projects.
- Skill recommendation is $O(E \times S)$ after extracting skills, where $E$ is employees and $S$ is extracted skills.
- Project daily aggregation filters sessions and events in memory after database reads; event volume is the scalability concern.
- AI output can be empty, unavailable, slow, or contain imperfect wording. The prompts reduce hallucination risk but are not a formal guarantee.
- Date logic is UTC-based for attendance and summary windows; clients must agree on date semantics.

## 9. Frontend Deep Dive

The web client is a Next.js 14 application using React 18, TypeScript, Tailwind, Framer Motion, Lucide, and local UI primitives. The app uses the Next app-router layout structure.

### Pages and role areas

Public routes include `/`, `/login`, `/forgot-password`, `/reset-password`, and `/style-guide`. Employee routes include dashboard, projects, daily summary, connections, attendance, and profile. Manager routes include dashboard, employees, roles, projects, team summaries, weekly reports, and attendance. A super-admin dashboard route exists. Navigation references additional super-admin pages whose page files are not clearly present.

### State and API communication

`AuthProvider` hydrates user and access-token state from localStorage on the client, exposes `login` and `logout`, and publishes an `auth:logout` browser event. `RouteGuard` and role layouts redirect based on that state. `web/src/lib/api.ts` centralizes JSON requests, adds the Bearer header, parses error bodies into `ApiError`, refreshes on 401, and retries the request.

`api-hooks.ts` contains API DTOs, hooks, and operations. Reusable components include the app shell, page header, route loader, data table, stat/metrics cards, employee/project cards, daily summary drawer/content, attendance badges, dialogs, date selector, and calendar components. Forms use local React state and backend DTO validation; loading and error behavior is handled in page/hooks code and the API wrapper.

### Important frontend caveat

There are Next route handlers under `web/src/app/api/` for employee daily summaries, attendance, and project weekly views. The inspected handlers return hard-coded or generated mock data, do not authenticate, do not query Prisma, and often do not use route parameters. The employee dashboard explicitly uses a mocked daily-summary handler for yesterday's activity. Therefore, do not describe those routes as production backend integrations.

### Routing and lifecycle

The app layouts provide role-specific navigation and wrap protected pages in client-side guards. On initial mount, `AuthProvider` reads localStorage and sets `hydrated`; this prevents an immediate unauthenticated decision before browser state is available. React effects register the logout event listener and hydrate auth. The app does not rely on Next middleware for authentication; the middleware is limited to special requests such as source maps and `.well-known` paths.

## 10. Backend Deep Dive

### Request lifecycle

```text
HTTP request
 -> Express/Nest routing
 -> global ValidationPipe (transform, whitelist, reject unknown fields)
 -> JwtAuthGuard / RolesGuard / PermissionsGuard when declared
 -> controller method
 -> domain service
 -> Prisma query or external integration
 -> returned DTO/object
 -> JSON response
```

The global exception filter converts Nest HTTP exceptions and selected Prisma errors into a consistent `{ statusCode, message, error }` response. `P2002` becomes 409, `P2025` becomes 404, and `P2003` becomes 400; unknown errors become a generic 500.

### API route inventory

| Area | Routes |
|---|---|
| Root | `GET /` |
| Auth | `POST /auth/login`, `/extension-login`, `/refresh`, `/forgot-password`, `/reset-password`, `/change-password` |
| Users | `GET /users/me`, `/me/connection-key`, `/users`, `POST /users`, `GET/PATCH/DELETE /users/:id` |
| Projects | `GET /projects/mine`, `/projects`, `POST /projects`, `GET/PATCH/DELETE /projects/:id`, employee/assignment routes, `POST /projects/recommend-skills` |
| Sessions | `POST /sessions/start`, `POST /sessions/:id/end`, `GET /sessions/active`, `/mine`, `/employee/:id` |
| Activity | `POST /activity`, `/activity/bulk`, `GET /activity/session/:sessionId` |
| Attendance | `POST /attendance/check-in`, `/check-out`, `GET /attendance/me`, `/attendance` |
| Updates | `POST /updates`, `GET /updates/mine/today`, `/updates/mine` |
| Summaries | Generate/manual/mine/team/employee/project/detail/edit/approve/reject routes under `/summaries` |
| Reports | Weekly generate/mine/employee/team under `/reports/weekly` |
| Dashboard | `GET /dashboard`, `/dashboard/me` |
| Organization | `/organization/me`, `/members`, `/roles`, `POST /roles`, `DELETE /roles/:id` |
| GitHub | `/github/connect`, `/callback`, `/status`, `/disconnect`, `/commits`, `/pull-requests` |
| AI | `GET /ai/context/:userId`, `POST /ai/generate/:userId`, `POST /ai/enhance-update` |
| Diagnostics | `GET /test-update`; production intent is unclear |

Controllers own transport concerns; services own business rules and Prisma composition. DTOs define bodies and queries. Modules assemble controllers/providers and import shared Prisma, auth, AI, email, or organization support as needed.

## 11. External APIs and Services

### GitHub

The GitHub OAuth service calls `https://github.com/login/oauth/access_token` to exchange an OAuth code and `https://api.github.com/user` to identify the account. It also calls GitHub repository commit and pull-request endpoints. The OAuth callback uses a signed state token according to the implementation notes; the callback itself is intentionally unauthenticated because the OAuth state is the handoff mechanism. The resulting access token and GitHub username are stored in `GithubConnection`. Failure behavior is surfaced as service/controller errors; explicit retry, timeout, and rate-limit handling are not clearly identifiable.

### OpenAI

The backend creates an OpenAI client only when `OPENAI_API_KEY` is present. It calls `chat.completions.create` with a system prompt, user message, configured model, and `max_tokens: 1024`. Missing configuration produces an internal server error explaining that the key must be set. Explicit timeout, retry, circuit breaker, and rate-limit handling are not visible.

### SMTP/email

Nodemailer is configured from SMTP environment variables. When SMTP is absent, the service logs the email contents to the backend console for development. It is used for welcome, password-change, password-reset, project assignment, project update, and project removal notifications. Email template interpolation and escaping should be reviewed before production.

### CLI-local AI providers

The CLI has a separate local AI client with actual request handling for OpenAI, OpenRouter, and Ollama. The codebase indicates Anthropic and Gemini provider options, but those paths return placeholder output rather than a completed provider integration. This is independent from the backend's OpenAI-only service.

## 12. AI/ML/LLM Deep Dive

### Actual pipeline

```text
Sessions + commit ActivityEvents + WorkUpdates
 -> UTC date filtering and project grouping
 -> JSON context with commits, notes, minutes, active-session flag
 -> OpenAI chat completion with system/user messages
 -> generated text
 -> DailySummary draft or report/update output
```

There is no embeddings model, vector database, retrieval-augmented generation, chunking pipeline, reranker, conversation memory, or document store. The system is structured-data prompting, not RAG.

### Daily summaries

`buildDayContext` selects sessions that start, end, or remain active during the requested UTC day. It includes project names, commit messages, update contents, and completed minutes. The prompt requires a Daily Summary section, groups by project, treats notes as accomplishments, and prohibits inferred impact or invented work.

### Weekly reports

The service concatenates approved daily summary text with day labels. The prompt asks for features completed, bugs fixed, PRs merged, blockers, and upcoming work, again prohibiting unsupported facts.

### Update enhancement

The service sends raw commit objects and an optional manual task. The prompt preserves one item per commit, categorizes common conventional-commit types, keeps chronological order, and does not connect unrelated commits.

### Defensible interview answers

- **Why AI?** To reduce the manual effort of converting raw engineering evidence into manager-readable summaries while keeping the evidence in the product's database.
- **Why this model/provider?** The repository uses configurable OpenAI chat completions, with `gpt-4o` as the default. The code does not document benchmark-based model selection, so do not claim one.
- **Why not RAG/embeddings?** The input is already structured, user-specific operational data; semantic document retrieval is not necessary for the current feature.
- **How reduce hallucinations?** Supply only selected structured context, use restrictive prompts, require explicit sections, and allow employee review/approval. This reduces but cannot eliminate hallucination.
- **How reduce token cost?** Bound by date, select only needed fields, omit non-commit events from daily context, use concise prompts, and cap output at 1024 tokens.
- **What if OpenAI is unavailable?** The request fails through the backend error path; there is no visible retry, fallback model, queue, or cached generation. A manual summary path exists and is the practical fallback.
- **How scale it?** Queue generation jobs, persist source snapshots, add provider timeouts/retries/circuit breakers, cache by input hash, measure token usage, and move long report generation off request threads.

## 13. Security Review

### Existing controls

- bcrypt password hashing and generic login failure messages.
- JWT signature verification and user existence checks.
- Global DTO whitelist plus rejection of unknown fields.
- Role and permission guards.
- CORS allowlist from `FRONTEND_URL`, with explicit methods/headers.
- Prisma parameterized queries rather than concatenated SQL.
- Password reset expiry and clearing after successful reset.
- Database unique constraints for email, project code, attendance/day, summary/day, report/week, assignments, and role permissions.

### Risks or gaps

1. Browser access and refresh tokens are in localStorage, so XSS can expose them.
2. Extension and CLI auth are stored in plaintext JSON.
3. GitHub access tokens and reset tokens are stored plaintext in the database.
4. No explicit rate limiting is visible for login, reset, AI, or GitHub routes.
5. No explicit request timeout or external API retry policy is visible.
6. Several manager/team queries appear to filter by role or status without consistently constraining `organizationId`, creating a potential cross-tenant data exposure risk.
7. Client-side route guards are not a security boundary.
8. Email HTML interpolation should be escaped to prevent markup injection into messages.
9. Default secrets in `.env.example` must never be used in deployment.
10. File upload handling for profile pictures, if the UI claims it, is not clearly backed by a server upload implementation.
11. No explicit security headers, CSRF strategy, or audit log is clearly identifiable.

### Improvements to propose in an interview

Use HttpOnly/Secure/SameSite cookies or an in-memory access-token pattern; rotate and revoke refresh tokens; hash reset tokens; encrypt GitHub tokens; use OS secret storage for clients; add rate limiting and request size limits; validate OAuth state/redirect assumptions; enforce organization ownership in every query; add database transactions for coupled state transitions; use a CSP and security headers; escape email templates; and add security-focused integration tests.

SQL injection is less likely because normal access is through Prisma's structured query API. The risk would return if unsafe raw queries were added; the repository does not show such queries. No NoSQL database is used, so NoSQL injection is not applicable to the implemented persistence layer.

## 14. Error Handling

### Backend

Services throw Nest exceptions for invalid credentials, conflicts, missing records, forbidden ownership, and invalid state. DTO validation rejects malformed or extra fields before the controller runs. The global exception filter normalizes HTTP and common Prisma errors. Unexpected exceptions return a generic 500 message, avoiding direct stack-trace exposure in the response.

### Frontend

The API wrapper parses JSON `{message}` or `{error}` bodies into `ApiError(status, message)`. A 401 triggers refresh and one retry. If refresh fails, tokens are cleared, a logout event is emitted, and the caller receives a session-expired error. Network failures during login are translated to an unable-to-reach-server message. Page-level loading, empty, and error components exist in the web client.

### External/database failures

Missing OpenAI configuration is converted to a 500 exception. SMTP absence falls back to logging. GitHub/OpenAI network timeout and retry behavior is not clearly implemented. Prisma duplicate, missing-reference, and missing-record errors are mapped centrally, although some services also catch specific Prisma codes for friendlier messages.

## 15. Testing and Operational Readiness

Root scripts support build, lint, Jest unit tests, coverage, and e2e tests. The checked-in automated tests are narrow: the app controller spec and e2e test primarily verify `GET /` and the Hello World response. `test-login.ts`, `test-dashboard.js`, and `scripts/test-api.js` are ad hoc diagnostic scripts rather than comprehensive suites.

There is no visible Dockerfile, compose file, GitHub Actions workflow, deployment manifest, or cloud provider configuration. The README documents basic npm installation, environment setup, start, and test commands. Production readiness therefore cannot be inferred from deployment automation.

High-value tests to add include authentication and refresh expiry, role/permission denial, organization isolation, session/attendance race conditions, summary state transitions, project assignment uniqueness, AI failure/manual fallback, GitHub OAuth state, and frontend token-refresh behavior.

## 16. Design Trade-offs

### PostgreSQL + Prisma versus MongoDB

- **Decision:** PostgreSQL with Prisma.
- **Why:** Strong relationships, uniqueness, foreign keys, approval workflow, and reporting joins are central.
- **Alternative:** MongoDB would simplify variable event documents, but would make relational integrity and reporting more application-driven.
- **Advantage:** Constraints and typed relations protect important invariants.
- **Disadvantage:** Schema changes require migration discipline; current checked-in migration drift is a real risk.
- **Change when:** Use a document/event store alongside PostgreSQL only if activity volume or event shape requires it, while keeping transactional business entities relational.

### REST versus GraphQL

- **Decision:** REST controllers with JSON DTOs.
- **Why:** Web, extension, and CLI clients need simple independent operations.
- **Alternative:** GraphQL could reduce overfetching for dashboards.
- **Advantage:** Clear route ownership, straightforward authorization, easy CLI integration.
- **Disadvantage:** Many dashboard-specific endpoints and possible overfetching.
- **Change when:** Add GraphQL or a dedicated aggregation API if dashboard query composition becomes a bottleneck.

### JWT versus server sessions

- **Decision:** Access/refresh JWTs.
- **Why:** Multiple clients can authenticate without sharing server session state.
- **Alternative:** HttpOnly cookie sessions or opaque refresh sessions.
- **Advantage:** Stateless access verification and easy client portability.
- **Disadvantage:** Revocation, stale permissions, and secure storage are harder.
- **Change when:** Prefer secure cookie-backed sessions or rotated opaque refresh tokens for a browser-first production deployment.

### Synchronous AI calls versus asynchronous jobs

- **Decision:** Synchronous OpenAI calls during summary/report requests.
- **Why:** Simple MVP flow and immediate response.
- **Alternative:** Queue workers with a job status.
- **Advantage:** Fewer moving parts and easy UX for small workloads.
- **Disadvantage:** User request latency, provider failure coupling, and poor scalability.
- **Change when:** Move generation to a queue when reports are large, usage grows, or reliability requirements increase.

### Cloud OpenAI versus local model

- **Decision:** Backend OpenAI SDK, with a separate CLI local/provider path.
- **Why:** Fast implementation and capable summarization for structured text.
- **Alternative:** Ollama/local model or another hosted provider.
- **Advantage:** No model hosting or GPU operations in the backend.
- **Disadvantage:** API cost, network dependency, data governance, and provider availability.
- **Change when:** Use a local or private model for sensitive organizations, or introduce provider abstraction and fallback after measuring quality and cost.

### JSON activity payload versus normalized event tables

- **Decision:** `ActivityEvent.payload` and raw commit JSON.
- **Why:** Different event types have different fields and the MVP needs flexible ingestion.
- **Alternative:** Separate commit, branch, PR, and file-edit tables.
- **Advantage:** Faster schema evolution and one ingestion endpoint.
- **Disadvantage:** Weaker database-level validation and harder analytics/indexing.
- **Change when:** Normalize high-volume event types after query patterns stabilize.

### Shared backend versus duplicated client logic

- **Decision:** Web, extension, and CLI call one backend; each client keeps a thin local adapter.
- **Why:** Centralizes business rules and gives users multiple entry points.
- **Advantage:** Consistent persistence and reporting.
- **Disadvantage:** Token storage and refresh behavior must be correctly implemented in three environments.
- **Change when:** Generate a typed API client or shared protocol package once DTO drift becomes costly.

## 17. Configured, Partial, and Unknown Areas

### Configured and implemented

`DATABASE_URL`, `JWT_SECRET`, refresh secret, GitHub OAuth variables, `PORT`, OpenAI key/model, SMTP variables, and backend CORS are represented in configuration and used in source, with the caveats about hard-coded expiration values above.

### Partial or mock

- Next mock API handlers return hard-coded/generated data.
- Super-admin role/data exists, but complete super-admin server workflows are not clearly implemented.
- CLI Anthropic/Gemini provider options do not have complete request implementations.
- Extension registers some commands that are not listed in contributed manifest commands.
- The status document describes UI polish and future work that should not be treated as proof of backend behavior.
- The root migration history does not fully represent the current Prisma schema.

### Not clearly identifiable from the codebase

- A public self-registration flow.
- Production deployment topology, cloud provider, Docker, or CI/CD.
- Whether the production database was manually synchronized beyond checked-in migrations.
- A formal data-retention policy, audit-log policy, rate-limiting policy, or SLA.
- Whether every frontend page is wired to live backend data.
- Benchmark evidence for OpenAI model choice.

## 18. Fast Interview Question Bank

**Why PostgreSQL?** The domain has strong relations and constraints: users to organizations, users to projects through assignments, sessions to activity, and one summary/attendance/report per time period. PostgreSQL makes those invariants explicit.

**How do you prevent an employee viewing another employee's summary?** Employee-owned routes check the authenticated user ID, and draft mutation helpers enforce ownership. Manager paths expose approved summaries. I would additionally enforce organization/resource ownership consistently because current queries are not uniformly tenant-scoped.

**How do you handle an expired access token?** The web wrapper receives 401, calls refresh with the refresh JWT, stores the new access token, and retries once. If refresh fails, it clears credentials and logs the user out client-side.

**What is the AI input?** Date-bounded session records, project names, commit messages, employee update content, and completed minutes. It is not arbitrary repository code and it is not a vector search system.

**What would you improve first?** Tenant isolation and credential storage are the highest security priorities; then migration reproducibility, transaction boundaries, rate limiting/timeouts, and tests around auth and state transitions.

**What is the biggest scalability concern?** Synchronous AI calls and in-memory aggregation of sessions/events for dashboard/report views. I would add pagination/indexes, aggregate queries or reporting tables, background jobs, and provider resilience.

## 19. Final Summary

Taskifier is best presented as a practical, modular developer-work reporting platform rather than as a fully finished enterprise deployment. Its strongest implemented story is the end-to-end data model and workflow: authenticated multi-client activity collection, relational persistence, AI-assisted summarization, approval, and manager reporting. Its most credible senior-engineering discussion is the ability to explain both the design and its boundaries: localStorage/plaintext token risks, incomplete tenant scoping, migration drift, mocked frontend routes, limited tests, and synchronous external dependencies. That honesty demonstrates understanding and gives a clear roadmap from MVP to production.