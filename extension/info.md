# Taskifier – Full‑Stack Overview

## Table of Contents
1. [Project Overview](#project-overview)
2. [Why These Technologies?](#why-these-technologies)
3. [Core Technologies & Tools](#core-technologies--tools)
   - [Node.js & TypeScript](#nodejs--typescript)
   - [VS Code Extension API](#vscode-extension-api)
   - [esbuild (Bundler)](#esbuild-bundler)
   - [Simple‑Git](#simple‑git)
   - [Inquirer / Prompt UI](#inquirer--prompt-ui)
   - [Express‑like Server (Fastify)](#fastify-backend)
   - [PostgreSQL / SQLite](#postgresql--sqlite)
   - [Prisma ORM](#prisma-orm)
   - [AI Provider Integrations](#ai-provider-integrations)
   - [Web Technologies (HTML/CSS/JS)](#web-technologies)
   - [Testing & Linting](#testing--linting)
4. [Architecture Diagram (Textual)](#architecture-diagram-textual)
5. [Data Flow & API Calls](#data-flow--api-calls)
   - [Login / Auth](#login--auth)
   - [Attendance](#attendance)
   - [Session Management](#session-management)
   - [Daily Summary Generation](#daily-summary-generation)
   - [Prompt Beautifier](#prompt-beautifier)
   - [Manager Dashboard Endpoints](#manager-dashboard-endpoints)
6. [Local Development Workflow](#local-development-workflow)
7. [Production Build & Packaging](#production-build--packaging)
8. [Security & Privacy Considerations](#security--privacy-considerations)
9. [Future Roadmap](#future-roadmap)
10. [References & Further Reading](#references--further-reading)

---

## Project Overview
Taskifier is an **AI‑powered developer productivity companion** that works across three surfaces:
- **VS Code Extension** – a sidebar dashboard & Prompt Beautifier UI.
- **CLI (`t` commands)** – a terminal‑first interface for logging sessions, generating updates, and managing AI configuration.
- **Web Application** – a cloud‑hosted dashboard for managers and organizations (currently under development).

The goal is to **eliminate manual daily‑report work** while keeping all data private unless the user explicitly opts into Organization mode.

---

## Why These Technologies?
| Requirement | Chosen Technology | Reasoning |
|-------------|-------------------|-----------|
| **Cross‑platform runtime** | **Node.js** (v20) | Runs on Windows, macOS, Linux. Provides a single JavaScript/TypeScript runtime for the CLI, VS Code extension host, and server. |
| **Static typing & developer productivity** | **TypeScript** | Adds compile‑time type safety, excellent IDE support, and easier refactoring for a large code‑base. |
| **Fast, lightweight bundler** | **esbuild** | Near‑instant builds, native TypeScript handling, and plugin system for copying assets. |
| **Git history inspection** | **simple‑git** | A thin wrapper around the Git CLI, making it easy to fetch commit logs, changed files, and diffs without spawning many child processes. |
| **Interactive terminal UI** | **@inquirer/prompts** | Provides beautiful dropdowns, inputs, and confirmations in the terminal (`t login`, `t ai setup`, …). |
| **Backend server** | **Fastify** (alternative to Express) | Very low overhead, fast schema validation, and built‑in support for TLS, which is ideal for a small SaaS‑style API. |
| **Database abstraction** | **Prisma ORM** | Generates type‑safe database client, supports migrations, works with both PostgreSQL (cloud) and SQLite (local). |
| **Relational DB** | **PostgreSQL** (cloud) / **SQLite** (offline) | PostgreSQL offers reliability, ACID guarantees, and extensions. SQLite gives a zero‑config, file‑based DB for Personal mode. |
| **AI service integration** | **OpenRouter / OpenAI / Anthropic / Gemini / Ollama** | All expose a standard HTTP `POST /v1/chat/completions`‑like API, making it easy to swap providers. |
| **VS Code Extension UI** | **Webview (HTML/CSS/JS)** | Allows rich, sandboxed UI using plain web tech while still respecting VS Code CSP. |
| **Styling** | **Vanilla CSS + CSS variables (`--vscode-*`)** | Guarantees the UI matches the host editor’s theme (dark/light) without extra libraries. |
| **Testing / Linting** | **ESLint, Prettier, jest** | Keeps code style consistent, catches bugs early, and provides unit tests for core logic (e.g., Git scanner). |

---

## Core Technologies & Tools
### Node.js & TypeScript
* **Node.js** – JavaScript runtime built on Chrome’s V8 engine. It allows us to run JavaScript outside a browser, use the file system, and spawn child processes (Git). Think of it as the **engine** that powers the CLI, the extension’s background process, and the server.
* **TypeScript** – A superset of JavaScript that adds static types. All source files (`*.ts`) are compiled to plain JavaScript (`*.js`) for Node.

### VS Code Extension API
* `vscode.WebviewViewProvider` – supplies the HTML/CSS/JS for the sidebar.
* `vscode.commands.executeCommand` – lets the webview trigger CLI actions (e.g., start session, copy text).
* State persistence via `vscode.setState` / `vscode.getState`.

### esbuild (Bundler)
* Bundles `src/extension.ts` and all its imports into a single `dist/extension.js`.
* Plugin **copy‑webview‑assets** automatically copies `src/dashboard/webview/*` into `dist/dashboard/webview/` so the VS IX contains the HTML, CSS, and image assets.

### simple‑git
* Runs `git log`, `git diff`, etc. under the hood and returns JavaScript objects.
* Used by the **Dashboard Manager** to compute:
  - Number of commits today.
  - Files changed.
  - Commit messages for the *Prompt Beautifier*.

### Inquirer / Prompt UI
* Provides the interactive menus you see when you run `t ai setup`, `t login`, etc.
* Handles validation, defaults, and secure password entry.

### Fastify (Backend Server)
* Minimalist HTTP framework.
* Routes are defined in `src/server/routes/*.ts`.
* Uses **JWT** (JSON Web Token) for auth – the token is stored locally after login and sent in the `Authorization: Bearer <token>` header.

### PostgreSQL / SQLite & Prisma ORM
* **Prisma schema** (`prisma/schema.prisma`) defines models: `User`, `Attendance`, `Session`, `Summary`, `Organization`, `TeamMember`.
* `npx prisma migrate dev` creates the DB tables.
* Prisma client (`prisma/client.ts`) gives type‑safe functions like `prisma.user.findUnique(...)`.
* When the app runs in **Personal mode**, it switches the connection string to a local SQLite file (`.taskifier/personal.db`).

### AI Provider Integrations
* All providers share a common interface defined in `src/utils/aiClient.ts`.
* `enhancePrompt(text)` → sends `POST` to the chosen provider’s chat endpoint with the user’s prompt and returns the beautified version.
* API keys are stored **only** in `~/.taskifier/config.json` (or environment variables in dev mode) – never bundled into the VS IX.

### Web Technologies (HTML/CSS/JS)
* `dashboard.html` – the core UI template.
* CSS uses VS Code’s theme variables (`--vscode-foreground`, `--vscode-button-background`, …) to automatically adapt to light/dark mode.
* JavaScript handles:
  - Rendering data received from the extension (`updateDashboard` message).
  - Collapsible sections (Accordion‑style) with local `vscode.setState` persistence.
  - Prompt Beautifier interactions (copy, regenerate, clear). 

### Testing & Linting
* **ESLint** (`.eslintrc.json`) enforces code style.
* **Prettier** (`.prettierrc`) formats files on save.
* **Jest** tests live in `src/**/*.test.ts` for core utilities like the Git scanner and AI client.

---

## Architecture Diagram (Textual)
```
+----------------------+      +-------------------+      +-------------------+
|  VS Code Extension   | <--> |   Node.js Host    | <--> |   Fastify API    |
|  (Webview UI)        |      | (CLI + Backend)   |      | (PostgreSQL)      |
+----------------------+      +-------------------+      +-------------------+
        ^   ^                         ^   ^                ^   ^
        |   |                         |   |                |   |
        |   |                         |   |                |   |
        |   |                         |   |                |   |
        |   +--- Simple‑Git ---------+   +--- Prisma ----+   +--- SQLite (Personal)
        |
        +--- Inquirer (terminal UI)
```
*The VS Code Sidebar, the terminal CLI, and the Fastify API all share the same Node.js process (via the bundled `dist/extension.js`).* 

---

## Data Flow & API Calls
### 1. Login / Auth
1. User runs `t login` → CLI calls **Fastify** `POST /auth/login` with email & mode.
2. Server validates (or creates) the user, issues a **JWT**.
3. CLI stores the JWT in `~/.taskifier/config.json`.
4. Extension reads the token on startup and includes it in every WebView‑to‑host message.

### 2. Attendance
* **CLI**: `t attend` → `POST /attendance` (payload `{ date, status }`).
* **Backend**: Stores a row in `Attendance` table.
* **Webview**: Receives updated attendance via `updateDashboard` and shows a green check or pending icon.

### 3. Session Management
* **Start Session** – `t start` → `POST /session/start` (stores `startedAt`).
* **End Session** – `t checkout` → `POST /session/end` (stores `endedAt`, calculates duration). 
* Live timer UI is driven by a `setInterval` in the webview that updates every second.

### 4. Daily Summary Generation
1. `t update` → **Git scanner** collects today’s commits, builds a prompt string.
2. Prompt passed to **AI client** (`enhancePrompt`) → sends request to the configured provider.
3. AI response is saved in `Summary` table via `POST /summary`.
4. `t submit` → `POST /summary/:id/submit` marks the summary as *approved* and optionally sends an email.

### 5. Prompt Beautifier
* **Webview**: User selects text, clicks *Prompt Beautifier* → `postMessage('beautifyPrompt', { text })`.
* **Extension**: Receives the message, calls `enhancePrompt(text)` (same AI client used for summaries).
* Result is sent back to the webview and displayed side‑by‑side in a diff view.

### 6. Manager Dashboard Endpoints (Organization mode)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/org/teams` | GET | List teams under the organization. |
| `/org/members/:teamId` | GET | List members of a team. |
| `/org/summary/:userId/:date` | GET | Retrieve a specific user’s daily summary. |
| `/org/attendance/:teamId` | GET | Aggregate attendance for a team. |
| `/org/report` | POST | Generate a PDF/Markdown report for the manager. |

All these routes require the JWT with an **`organization`** scope.

---

## Local Development Workflow
1. **Clone the repo** → `git clone https://github.com/karthik-0004/Taskifier`.
2. **Install dependencies** → `npm install` (runs both extension and web app deps).
3. **Run the VS Code extension**:
   - Open the `extension` folder in VS Code.
   - Press `F5` – a new Extension Development Host window launches.
   - The sidebar appears; you can test UI + CLI commands.
4. **Run the backend** (for Organization mode):
   - `cd web && npx prisma migrate dev` (creates local Postgres DB).
   - `npm run dev` (starts Fastify on `http://localhost:3001`).
5. **Run the CLI**:
   - `npm link` inside the root to expose the `t` command globally.
   - Use `t login`, `t start`, `t update`, etc.
6. **Hot‑reloading** – `npm run watch` uses **esbuild** in watch mode; any change to `.ts` files rebuilds `dist/extension.js` instantly.

---

## Production Build & Packaging
* **Bundle:** `npm run package` → runs `esbuild.js --production`. This:
  1. Bundles all TypeScript into `dist/extension.js`.
  2. Copies the dashboard assets into `dist/dashboard/webview/` (via the custom esbuild plugin).
* **Package VSIX:** `vsce package` reads `.vscodeignore` (which excludes `src/**`) and creates `taskifier-0.0.1.vsix` containing only the compiled code and the copied assets.
* **Publish:** `vsce publish` (or upload the VSIX manually) makes the extension available in the VS Code Marketplace.

---

## Security & Privacy Considerations
| Concern | Mitigation |
|---------|------------|
| **API keys leaking** | Stored only in `~/.taskifier/config.json` (local file) and never bundled. Development mode can use environment variables, which are also excluded by `.vscodeignore`. |
| **Unauthorized data access** | All backend endpoints require a signed JWT. Token includes a `mode` claim (`personal` vs `organization`). |
| **Cross‑site scripting in webview** | Webview content is generated from a static HTML file; only messages from the extension host are processed, and all data is escaped before insertion. |
| **Data isolation between organizations** | Prisma schema includes `organizationId` foreign key; every query filters by this ID. No cross‑tenant joins without explicit permission. |
| **Transport security** | Fastify runs behind HTTPS in production (TLS termination handled by Cloud provider). |

---

## Future Roadmap
- **Full Organization Dashboard** (React + Ant Design) for managers.
- **Real‑time WebSocket updates** so managers see live timers without polling.
- **Advanced analytics** (burn‑down charts, velocity, etc.).
- **Team‑wide AI suggestions** (auto‑suggested tasks based on commit trends).
- **Multi‑provider fallback** – automatically switch to a backup AI model if the primary provider is down.

---

## References & Further Reading
- **Node.js** – https://nodejs.org/en/about/
- **VS Code Extension API** – https://code.visualstudio.com/api
- **Prisma ORM** – https://www.prisma.io/docs
- **Fastify** – https://www.fastify.io/
- **simple‑git** – https://github.com/steveukx/git-js
- **Inquirer.js** – https://github.com/SBoudrias/Inquirer.js
- **OpenRouter** – https://openrouter.ai/
- **Ollama (local LLM)** – https://ollama.com/

---

*This file (`info.md`) is intended as a quick‑reference README for anyone who needs to understand the full stack, the reasons behind each choice, and how the pieces fit together.*
