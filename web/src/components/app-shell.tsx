"use client"

import {
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"
import { Avatar, type AvatarProps } from "@/components/ui/avatar"

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
  href?: string
  badge?: string | number
  badgeVariant?: "default" | "success" | "warning" | "danger" | "accent"
}

interface NavConfig {
  items: NavItem[]
}

interface UserMenu {
  name: string
  email?: string
  avatar?: AvatarProps
}

interface AppShellProps {
  nav: NavConfig
  user: UserMenu
  activeNavId?: string
  onNavClick: (id: string) => void
  onNotificationsClick?: () => void
  onLogout?: () => void
  children: ReactNode
  className?: string
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    setDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return desktop
}

export function AppShell({
  nav,
  user,
  activeNavId,
  onNavClick,
  onNotificationsClick,
  onLogout,
  children,
  className,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDesktop = useIsDesktop()

  const sidebarExpanded = isDesktop ? !collapsed : mobileOpen

  return (
    <div className={cn("flex min-h-dvh bg-background", className)}>
      {/* Mobile overlay backdrop */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — same structure on server & client; CSS handles position/size */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-dvh flex-col border-r bg-card transition-all duration-300",
          isDesktop
            ? collapsed ? "w-16" : "w-60"
            : mobileOpen
              ? "w-60 translate-x-0"
              : "w-60 -translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <div className="size-8 shrink-0 rounded-lg bg-accent flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          {sidebarExpanded && (
            <span className="text-body-sm font-semibold truncate">Taskifier</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.items.map((item) => {
            const active = activeNavId === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavClick(item.id)
                  if (!isDesktop) setMobileOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-medium transition-all",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={isDesktop && collapsed ? item.label : undefined}
              >
                <span className="shrink-0 size-5 flex items-center justify-center">
                  {item.icon}
                </span>
                {sidebarExpanded && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge != null && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] h-[18px]",
                          !item.badgeVariant || item.badgeVariant === "accent"
                            ? "bg-accent/10 text-accent"
                            : item.badgeVariant === "success"
                              ? "bg-success/10 text-success"
                              : item.badgeVariant === "warning"
                                ? "bg-warning/10 text-warning"
                                : item.badgeVariant === "danger"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="items-center justify-center h-10 border-t text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn("transition-transform duration-300", collapsed && "rotate-180")}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </aside>

      {/* Main area */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isDesktop && (collapsed ? "ml-16" : "ml-60")
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen((c) => !c)}
            className="flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18" />
                  <path d="M3 6h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>

          <div className="flex-1" />

          <button
            onClick={onNotificationsClick}
            className="relative flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
          </button>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-body-sm font-medium leading-tight">{user.name}</p>
              {user.email && (
                <p className="text-caption text-muted-foreground leading-tight">{user.email}</p>
              )}
            </div>
            <Avatar name={user.name} size="sm" {...user.avatar} />
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-1 flex items-center justify-center size-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Log out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
