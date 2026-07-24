"use client"

import { type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  FileEdit,
  Clock,
  Link2,
  CalendarCheck,
  Settings,
  User
} from "lucide-react"
import { RouteGuard } from "@/lib/route-guard"
import { useAuth } from "@/lib/auth-context"
import { AppShell, type NavItem } from "@/components/app-shell"

const employeeNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/employee/dashboard" },
  { id: "my-projects", label: "My Projects", icon: <Briefcase size={18} />, href: "/employee/my-projects" },
  { id: "daily-summary", label: "Daily Summary", icon: <FileEdit size={18} />, href: "/employee/daily-summary" },
  { id: "connections", label: "Connections", icon: <Link2 size={18} />, href: "/employee/connections" },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck size={18} />, href: "/employee/attendance" },
  { id: "profile", label: "Profile", icon: <User size={18} />, href: "/employee/profile" },
]

const navIdFromPath = new Map<string, string>(
  employeeNav.map((n) => [n.href!, n.id])
)

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const activeNavId = navIdFromPath.get(pathname)

  return (
    <RouteGuard allowedRole="EMPLOYEE">
      <AppShell
        nav={{ items: employeeNav }}
        user={{
          name: user?.name ?? "",
          email: user?.email,
        }}
        activeNavId={activeNavId}
        onNavClick={(id) => {
          const item = employeeNav.find((n) => n.id === id)
          if (item?.href) router.push(item.href)
        }}
        onLogout={logout}
      >
        {children}
      </AppShell>
    </RouteGuard>
  )
}
