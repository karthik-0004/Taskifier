"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { DataTable, type Column } from "@/components/data-table"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { SlideUp, FadeIn, StaggerList } from "@/components/animations"
import { AppShell, type NavItem } from "@/components/app-shell"
import { useState } from "react"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-h2">{children}</h2>
      <hr className="border-border" />
    </div>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-h3 text-muted-foreground">{children}</h3>
  )
}

const colorGroups = [
  {
    label: "Base",
    colors: [
      { name: "Background", var: "--background" },
      { name: "Foreground", var: "--foreground" },
      { name: "Card", var: "--card" },
      { name: "Card Foreground", var: "--card-foreground" },
      { name: "Popover", var: "--popover" },
      { name: "Popover Foreground", var: "--popover-foreground" },
      { name: "Border", var: "--border" },
      { name: "Input", var: "--input" },
      { name: "Ring", var: "--ring" },
    ],
  },
  {
    label: "Semantic",
    colors: [
      { name: "Primary", var: "--primary" },
      { name: "Primary Foreground", var: "--primary-foreground" },
      { name: "Secondary", var: "--secondary" },
      { name: "Secondary Foreground", var: "--secondary-foreground" },
      { name: "Muted", var: "--muted" },
      { name: "Muted Foreground", var: "--muted-foreground" },
    ],
  },
  {
    label: "Accent Scale",
    colors: [
      { name: "Accent 50", var: "--accent-50" },
      { name: "Accent 100", var: "--accent-100" },
      { name: "Accent 200", var: "--accent-200" },
      { name: "Accent 300", var: "--accent-300" },
      { name: "Accent 400", var: "--accent-400" },
      { name: "Accent (500)", var: "--accent" },
      { name: "Accent 600", var: "--accent-600" },
      { name: "Accent 700", var: "--accent-700" },
      { name: "Accent 800", var: "--accent-800" },
      { name: "Accent 900", var: "--accent-900" },
      { name: "Accent Foreground", var: "--accent-foreground" },
    ],
  },
  {
    label: "State",
    colors: [
      { name: "Success", var: "--success" },
      { name: "Success Foreground", var: "--success-foreground" },
      { name: "Warning", var: "--warning" },
      { name: "Warning Foreground", var: "--warning-foreground" },
      { name: "Destructive", var: "--destructive" },
      { name: "Destructive Foreground", var: "--destructive-foreground" },
    ],
  },
]

const typeScale = [
  { name: "Display", class: "text-display" },
  { name: "Heading 1", class: "text-h1" },
  { name: "Heading 2", class: "text-h2" },
  { name: "Heading 3", class: "text-h3" },
  { name: "Body", class: "text-body" },
  { name: "Body Small", class: "text-body-sm" },
  { name: "Caption", class: "text-caption" },
]

const shadowScale = [
  { name: "Soft", class: "shadow-soft" },
  { name: "Card", class: "shadow-card" },
  { name: "Elevated", class: "shadow-elevated" },
]

const radiusScale = [
  { name: "None", class: "rounded-none" },
  { name: "SM", class: "rounded-sm" },
  { name: "MD", class: "rounded-md" },
  { name: "Default", class: "rounded" },
  { name: "LG", class: "rounded-lg" },
  { name: "XL", class: "rounded-xl" },
]

function ColorSwatch({ name, var: cssVar }: { name: string; var: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
      <div
        className="size-10 rounded-xl border shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-body-sm font-medium">{name}</span>
        <span className="text-caption text-muted-foreground font-mono">{cssVar}</span>
      </div>
    </div>
  )
}

// ─── Fake data types ───

interface SummaryRow {
  id: string
  employee: string
  date: string
  status: "APPROVED" | "DRAFT" | "REJECTED"
  hours: string
}

const fakeSummaries: SummaryRow[] = [
  { id: "1", employee: "Alice Chen", date: "2026-07-23", status: "APPROVED", hours: "6h 30m" },
  { id: "2", employee: "Bob Jones", date: "2026-07-23", status: "DRAFT", hours: "4h 15m" },
  { id: "3", employee: "Carol Lee", date: "2026-07-22", status: "APPROVED", hours: "7h 00m" },
  { id: "4", employee: "David Kim", date: "2026-07-22", status: "REJECTED", hours: "5h 45m" },
  { id: "5", employee: "Eve Torres", date: "2026-07-21", status: "APPROVED", hours: "6h 10m" },
]

const summaryColumns: Column<SummaryRow>[] = [
  {
    key: "employee",
    header: "Employee",
    sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={r.employee} size="sm" />
        <span className="font-medium">{r.employee}</span>
      </div>
    ),
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (r) => <span className="text-muted-foreground">{r.date}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (r) => (
      <Badge
        variant={
          r.status === "APPROVED" ? "success" :
          r.status === "REJECTED" ? "danger" : "default"
        }
      >
        {r.status}
      </Badge>
    ),
  },
  {
    key: "hours",
    header: "Hours",
    sortable: true,
    render: (r) => <span className="tabular-nums">{r.hours}</span>,
    cellClassName: "text-right",
  },
]

export default function StyleGuide() {
  const { toast } = useToast()

  // ─── Manager nav demo ───
  const [activeManagerNav, setActiveManagerNav] = useState("dashboard")

  const managerNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>,
      badge: "3",
    },
    {
      id: "team",
      label: "Team",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      id: "summaries",
      label: "Summaries",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      badge: "5",
      badgeVariant: "warning",
    },
    {
      id: "projects",
      label: "Projects",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
      badge: "12",
      badgeVariant: "accent",
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/><path d="M3 12h18"/><path d="M12 2v4"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>,
    },
  ]

  const employeeNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      id: "summaries",
      label: "My Summaries",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      id: "projects",
      label: "Projects",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    },
  ]

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-display">Design System</h1>
          <p className="text-body text-muted-foreground mt-2 max-w-xl">
            Taskifier design tokens and UI component library — all variants
            demonstrated at a glance.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-20">

        {/* ─── COLORS ─── */}
        <section className="space-y-6">
          <SectionHeading>Colors</SectionHeading>
          <div className="grid gap-10">
            {colorGroups.map((group) => (
              <div key={group.label} className="space-y-3">
                <h3 className="text-h3 text-muted-foreground">{group.label}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {group.colors.map((c) => (
                    <ColorSwatch key={c.var} name={c.name} var={c.var} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TYPOGRAPHY ─── */}
        <section className="space-y-6">
          <SectionHeading>Typography</SectionHeading>
          <div className="space-y-1 divide-y">
            {typeScale.map((t) => (
              <div key={t.name} className="flex items-baseline gap-6 py-4 first:pt-0">
                <span className="text-caption text-muted-foreground w-24 shrink-0">{t.name}</span>
                <span className={t.class}>The quick brown fox jumps over the lazy dog.</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SHADOWS ─── */}
        <section className="space-y-6">
          <SectionHeading>Shadows</SectionHeading>
          <div className="flex flex-wrap gap-6">
            {shadowScale.map((s) => (
              <div key={s.name} className={`${s.class} bg-card rounded-xl px-6 py-8 w-48 text-center`}>
                <span className="text-body-sm font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── BORDER RADIUS ─── */}
        <section className="space-y-6">
          <SectionHeading>Border Radius</SectionHeading>
          <div className="flex flex-wrap gap-6 items-end">
            {radiusScale.map((r) => (
              <div key={r.name} className="text-center space-y-2">
                <div className={`${r.class} size-16 bg-accent/10 border border-accent/20`} />
                <span className="text-caption text-muted-foreground block">{r.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SPACING ─── */}
        <section className="space-y-6">
          <SectionHeading>Spacing &amp; Sizing</SectionHeading>
          <div className="space-y-2">
            {[3, 4, 5, 6, 8, 10, 12, 16, 18, 20, 24].map((n) => (
              <div key={n} className="flex items-center gap-4">
                <span className="text-caption text-muted-foreground w-16 text-right font-mono">{n}</span>
                <div className="h-4 bg-accent/10 rounded" style={{ width: `${n * 0.25}rem` }} />
              </div>
            ))}
          </div>
        </section>

        {/* ─── BUTTONS ─── */}
        <section className="space-y-6">
          <SectionHeading>Button</SectionHeading>
          <div className="space-y-8">
            <div className="space-y-4">
              <SubHeading>Variants</SubHeading>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
            <div className="space-y-4">
              <SubHeading>Sizes</SubHeading>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-4">
              <SubHeading>States</SubHeading>
              <div className="flex flex-wrap gap-3 items-center">
                <Button disabled>Disabled</Button>
                <Button variant="accent" disabled>Disabled Accent</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BADGES ─── */}
        <section className="space-y-6">
          <SectionHeading>Badge</SectionHeading>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">DRAFT</Badge>
            <Badge variant="success">APPROVED</Badge>
            <Badge variant="warning">PENDING</Badge>
            <Badge variant="danger">REJECTED</Badge>
            <Badge variant="accent">ACTIVE</Badge>
          </div>
        </section>

        {/* ─── FORM ELEMENTS ─── */}
        <section className="space-y-6">
          <SectionHeading>Form Elements</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-6 max-w-lg">
            <FormField label="Email" required>
              <Input type="email" placeholder="you@company.com" />
            </FormField>
            <FormField label="Name" error="Name is required">
              <Input placeholder="Enter your name" hasError />
            </FormField>
            <FormField label="Role" required>
              <Select placeholder="Select a role">
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
              </Select>
            </FormField>
            <FormField label="Description">
              <Textarea placeholder="Write a description…" rows={3} />
            </FormField>
          </div>
        </section>

        {/* ─── AVATAR ─── */}
        <section className="space-y-6">
          <SectionHeading>Avatar</SectionHeading>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar name="Alice Smith" size="sm" />
            <Avatar name="Bob Jones" size="md" />
            <Avatar name="Carol Lee" size="lg" />
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Linus Torvalds" />
            <Avatar name="Margaret Hamilton" />
            <Avatar src="https://api.dicebear.com/9.x/avataaars/svg?seed=test" alt="User" name="User" />
          </div>
        </section>

        {/* ─── CARD ─── */}
        <section className="space-y-6">
          <SectionHeading>Card</SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Project Alpha</CardTitle>
                <CardDescription>Frontend redesign</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-muted-foreground">4 members · 12 tasks</p>
              </CardContent>
              <CardFooter><Badge variant="accent">Active</Badge></CardFooter>
            </Card>
            <Card hover="lift">
              <CardHeader>
                <CardTitle>API v2</CardTitle>
                <CardDescription>Backend migration</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-muted-foreground">2 members · 8 tasks</p>
              </CardContent>
              <CardFooter><Badge variant="warning">Paused</Badge></CardFooter>
            </Card>
            <Card hover="lift">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                  <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                </svg>
                <span className="text-body-sm font-medium">New Project</span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── SKELETON ─── */}
        <section className="space-y-6">
          <SectionHeading>Skeleton</SectionHeading>
          <div className="flex gap-6 items-start">
            <div className="space-y-3 w-56">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="size-10" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" className="w-3/4" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
              <Skeleton variant="rectangular" className="h-28 w-full" />
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
            <div className="space-y-3 w-48">
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-5/6 animation-delay-200" />
              <Skeleton variant="text" className="w-2/3 animation-delay-300" />
            </div>
          </div>
        </section>

        {/* ─── TOOLTIP ─── */}
        <section className="space-y-6">
          <SectionHeading>Tooltip</SectionHeading>
          <div className="flex flex-wrap gap-6 items-center py-4">
            <Tooltip content="Top tooltip" side="top"><Button variant="outline" size="sm">Top</Button></Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom"><Button variant="outline" size="sm">Bottom</Button></Tooltip>
            <Tooltip content="Left tooltip" side="left"><Button variant="outline" size="sm">Left</Button></Tooltip>
            <Tooltip content="Right tooltip" side="right"><Button variant="outline" size="sm">Right</Button></Tooltip>
            <Tooltip content="Notifications">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </button>
            </Tooltip>
          </div>
        </section>

        {/* ─── TOAST ─── */}
        <section className="space-y-6">
          <SectionHeading>Toast Notifications</SectionHeading>
          <div className="flex flex-wrap gap-3">
            <Button variant="accent" onClick={() => toast("Changes saved!", "success")}>Success</Button>
            <Button variant="destructive" onClick={() => toast("Something went wrong.", "error")}>Error</Button>
            <Button variant="primary" onClick={() => toast("3 new notifications.", "info")}>Info</Button>
          </div>
        </section>

        {/* ─── PAGE HEADER ─── */}
        <section className="space-y-6">
          <SectionHeading>PageHeader</SectionHeading>
          <div className="space-y-8">
            <PageHeader title="Dashboard" subtitle="Overview of your team's activity for today." />
            <PageHeader
              title="Team Summaries"
              subtitle="Review and approve daily summaries submitted by your team."
              action={<Button variant="accent">Generate Report</Button>}
            />
            <PageHeader title="Settings" />
          </div>
        </section>

        {/* ─── EMPTY STATE ─── */}
        <section className="space-y-6">
          <SectionHeading>EmptyState</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
            <EmptyState
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              message="No summaries yet"
              description="Daily summaries will appear here once your team starts submitting them."
            />
            <EmptyState
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
              message="No activity recorded"
              description="Start a work session to log your activity for the day."
              action={<Button size="sm" variant="accent">Start Session</Button>}
            />
          </div>
        </section>

        {/* ─── STAT CARD ─── */}
        <section className="space-y-6">
          <SectionHeading>StatCard</SectionHeading>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Employees"
              value={12}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              label="Approved Today"
              value={7}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              label="Pending Review"
              value={3}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>}
              trend={{ value: 5, positive: false }}
            />
            <StatCard
              label="Total Hours"
              value={164}
              suffix="h"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              trend={{ value: 3, positive: true }}
            />
          </div>
        </section>

        {/* ─── DATA TABLE ─── */}
        <section className="space-y-6">
          <SectionHeading>DataTable</SectionHeading>
          <div className="space-y-8">
            <div>
              <SubHeading>With data</SubHeading>
              <DataTable
                columns={summaryColumns}
                data={fakeSummaries}
                keyExtractor={(r) => r.id}
                onRowClick={(r) => toast(`Clicked ${r.employee}`, "info")}
              />
            </div>
            <div>
              <SubHeading>Loading skeleton</SubHeading>
              <DataTable
                columns={summaryColumns}
                data={[]}
                keyExtractor={(r) => r.id}
                loading
              />
            </div>
            <div>
              <SubHeading>Empty state</SubHeading>
              <DataTable
                columns={summaryColumns}
                data={[]}
                keyExtractor={(r) => r.id}
                emptyMessage="No summaries match your filters"
                emptyDescription="Try adjusting the date range or check back later."
                emptyIcon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              />
            </div>
          </div>
        </section>

        {/* ─── HORIZONTAL SCROLLER ─── */}
        <section className="space-y-6">
          <SectionHeading>HorizontalScroller</SectionHeading>
          <SubHeading>Pending approvals (desktop arrows on hover)</SubHeading>
          <HorizontalScroller>
            {fakeSummaries.map((s) => (
              <Card key={s.id} hover="lift" className="w-64">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Avatar name={s.employee} size="sm" />
                    <Badge
                      variant={s.status === "APPROVED" ? "success" : s.status === "REJECTED" ? "danger" : "default"}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">{s.employee}</p>
                    <p className="text-caption text-muted-foreground">{s.date} · {s.hours}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" className="flex-1" onClick={() => toast(`Approved ${s.employee}`, "success")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2" onClick={() => toast(`Rejected ${s.employee}`, "error")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </HorizontalScroller>
        </section>

        {/* ─── ANIMATIONS ─── */}
        <section className="space-y-6">
          <SectionHeading>Animations</SectionHeading>
          <div className="space-y-8">
            <div className="space-y-4">
              <SubHeading>SlideUp</SubHeading>
              <div className="flex flex-wrap gap-3">
                <SlideUp delay={0}><Button variant="accent" size="sm">Slide 1</Button></SlideUp>
                <SlideUp delay={0.1}><Button variant="accent" size="sm">Slide 2</Button></SlideUp>
                <SlideUp delay={0.2}><Button variant="accent" size="sm">Slide 3</Button></SlideUp>
                <SlideUp delay={0.3}><Button variant="accent" size="sm">Slide 4</Button></SlideUp>
              </div>
            </div>
            <div className="space-y-4">
              <SubHeading>FadeIn</SubHeading>
              <div className="flex flex-wrap gap-3">
                <FadeIn delay={0}><Badge variant="success">Fade 1</Badge></FadeIn>
                <FadeIn delay={0.1}><Badge variant="success">Fade 2</Badge></FadeIn>
                <FadeIn delay={0.2}><Badge variant="success">Fade 3</Badge></FadeIn>
                <FadeIn delay={0.3}><Badge variant="success">Fade 4</Badge></FadeIn>
              </div>
            </div>
            <div className="space-y-4">
              <SubHeading>StaggerList</SubHeading>
              <StaggerList className="space-y-2 max-w-md">
                <Card><CardContent className="py-3 px-4"><p className="text-body-sm font-medium">Item 1 — fades + slides in</p></CardContent></Card>
                <Card><CardContent className="py-3 px-4"><p className="text-body-sm font-medium">Item 2 — staggered 50ms apart</p></CardContent></Card>
                <Card><CardContent className="py-3 px-4"><p className="text-body-sm font-medium">Item 3 — no manual delay needed</p></CardContent></Card>
                <Card><CardContent className="py-3 px-4"><p className="text-body-sm font-medium">Item 4 — just wrap children in array</p></CardContent></Card>
              </StaggerList>
            </div>
          </div>
        </section>

        {/* ─── APP SHELL ─── */}
        <section className="space-y-6">
          <SectionHeading>AppShell</SectionHeading>
          <SubHeading>Manager navigation</SubHeading>
          <p className="text-caption text-muted-foreground mb-4">
            Click nav items to see active state. Use the collapse arrow at the bottom-left.
            The user menu, notifications, and logout button are built-in.
          </p>
          <div className="rounded-xl border overflow-hidden shadow-elevated" style={{ height: 480 }}>
            <AppShell
              nav={{ items: managerNav }}
              user={{ name: "Sarah Manager", email: "sarah@taskifier.io" }}
              activeNavId={activeManagerNav}
              onNavClick={(id) => { setActiveManagerNav(id); toast(`Navigated to ${id}`, "info") }}
              onNotificationsClick={() => toast("No new notifications", "info")}
              onLogout={() => toast("Logged out", "info")}
            >
              <FadeIn key={activeManagerNav}>
                <PageHeader
                  title={managerNav.find((n) => n.id === activeManagerNav)?.label || "Dashboard"}
                  subtitle="Interactive demo inside the AppShell layout."
                  action={<Button variant="accent" size="sm" onClick={() => toast("Action clicked", "success")}>Action</Button>}
                />
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <StatCard label="Active" value={12} trend={{ value: 8, positive: true }} />
                  <StatCard label="Pending" value={3} trend={{ value: 5, positive: false }} />
                  <StatCard label="Completed" value={24} trend={{ value: 15, positive: true }} />
                </div>
                <div className="mt-6">
                  <DataTable
                    columns={summaryColumns}
                    data={fakeSummaries}
                    keyExtractor={(r) => r.id}
                    onRowClick={() => toast("Row clicked", "info")}
                  />
                </div>
              </FadeIn>
            </AppShell>
          </div>

          <div className="mt-8">
            <SubHeading>Employee navigation</SubHeading>
            <div className="rounded-xl border overflow-hidden shadow-elevated" style={{ height: 420 }}>
              <AppShell
                nav={{ items: employeeNav }}
                user={{ name: "Alex Employee", email: "alex@taskifier.io" }}
                activeNavId="sessions"
                onNavClick={(id) => toast(`Navigated to ${id}`, "info")}
                onLogout={() => toast("Logged out", "info")}
              >
                <PageHeader title="Current Session" subtitle="You have an active session running." action={<Button variant="destructive" size="sm" onClick={() => toast("Session ended", "error")}>End Session</Button>} />
                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
                  <StatCard label="Today" value={4.5} suffix="h" />
                  <StatCard label="This Week" value={22} suffix="h" trend={{ value: 10, positive: true }} />
                </div>
              </AppShell>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t mt-20">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-caption text-muted-foreground">
          Taskifier Design System
        </div>
      </footer>
    </div>
  )
}
