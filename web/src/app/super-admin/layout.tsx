"use client"

import { type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
} from "lucide-react"
import { RouteGuard } from "@/lib/route-guard"
import { useAuth } from "@/lib/auth-context"
import { AppShell, type NavItem } from "@/components/app-shell"

const superAdminNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/super-admin/dashboard" },
  { id: "organizations", label: "Organizations", icon: <Building2 size={18} />, href: "/super-admin/organizations" },
  { id: "system-users", label: "System Users", icon: <Users size={18} />, href: "/super-admin/users" },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, href: "/super-admin/settings" },
]

const navIdFromPath = new Map<string, string>(
  superAdminNav.map((n) => [n.href!, n.id])
)

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const activeNavId = navIdFromPath.get(pathname)

  return (
    <RouteGuard allowedRole="SUPER_ADMIN">
      <AppShell
        nav={{ items: superAdminNav }}
        user={{
          name: user?.name ?? "Super Admin",
          email: user?.email,
        }}
        activeNavId={activeNavId}
        onNavClick={(id) => {
          const item = superAdminNav.find((n) => n.id === id)
          if (item?.href) router.push(item.href)
        }}
        onLogout={logout}
      >
        <div className="bg-background min-h-full">
          {children}
        </div>
      </AppShell>
    </RouteGuard>
  )
}
