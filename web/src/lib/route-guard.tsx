"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type Role } from "@/lib/auth-context"

interface RouteGuardProps {
  children: ReactNode
  allowedRole: Role
}

export function RouteGuard({ children, allowedRole }: RouteGuardProps) {
  const { user, isAuthenticated, hydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (user && user.role !== allowedRole) {
      const target = user.role === "MANAGER" ? "/manager/dashboard" : "/employee/dashboard"
      router.replace(target)
    }
  }, [hydrated, isAuthenticated, user, allowedRole, router])

  if (!hydrated) return null
  if (!isAuthenticated) return null
  if (user && user.role !== allowedRole) return null

  return <>{children}</>
}
