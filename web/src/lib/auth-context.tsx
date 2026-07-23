"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type Role = "MANAGER" | "EMPLOYEE"

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hydrated: boolean
  login: (email: string, password: string) => Promise<Role>
  logout: () => void
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const storedUser = (() => {
      const raw = localStorage.getItem("user")
      if (!raw) return null
      try { return JSON.parse(raw) as User } catch { return null }
    })()
    const storedToken = localStorage.getItem("accessToken")
    setUser(storedUser)
    setAccessToken(storedToken)
    setHydrated(true)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setUser(null)
    setAccessToken(null)

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = await res.text()
        let message: string
        try {
          const parsed = JSON.parse(body)
          message = parsed.message ?? parsed.error ?? "Login failed"
        } catch {
          message = body || "Login failed"
        }
        throw new Error(message)
      }

      const data = await res.json()

      const loggedInUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as Role,
      }

      localStorage.setItem("user", JSON.stringify(loggedInUser))
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)

      setUser(loggedInUser)
      setAccessToken(data.accessToken)
      setIsLoading(false)

      return loggedInUser.role
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error("Unable to reach the server. Please check your connection.")
      }
      setIsLoading(false)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    setUser(null)
    setAccessToken(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      hydrated,
      login,
      logout,
    }),
    [user, accessToken, isLoading, hydrated, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
