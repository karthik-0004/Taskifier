"use client"

import { type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  BarChart3,
  CalendarCheck,
} from "lucide-react"
import { RouteGuard } from "@/lib/route-guard"
import { useAuth } from "@/lib/auth-context"
import { AppShell, type NavItem } from "@/components/app-shell"

const managerNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/manager/dashboard" },
  { id: "employees", label: "Employees", icon: <Users size={18} />, href: "/manager/employees" },
  { id: "projects", label: "Projects", icon: <FolderKanban size={18} />, href: "/manager/projects" },
  { id: "team-summaries", label: "Team Summaries", icon: <FileText size={18} />, href: "/manager/team-summaries" },
  { id: "weekly-reports", label: "Weekly Reports", icon: <BarChart3 size={18} />, href: "/manager/weekly-reports" },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck size={18} />, href: "/manager/attendance" },
]

const navIdFromPath = new Map<string, string>(
  managerNav.map((n) => [n.href!, n.id])
)

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const activeNavId = navIdFromPath.get(pathname)

  return (
    <RouteGuard allowedRole="MANAGER">
      <AppShell
        nav={{ items: managerNav }}
        user={{
          name: user?.name ?? "",
          email: user?.email,
        }}
        activeNavId={activeNavId}
        onNavClick={(id) => {
          const item = managerNav.find((n) => n.id === id)
          if (item?.href) router.push(item.href)
        }}
        onLogout={logout}
      >
        {children}
      </AppShell>
    </RouteGuard>
  )
}
