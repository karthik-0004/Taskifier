"use client"

import { type FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading, user, hydrated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      router.replace(user.role === "MANAGER" ? "/manager/dashboard" : "/employee/dashboard")
    }
  }, [hydrated, isAuthenticated, user, router])

  if (hydrated && isAuthenticated) {
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Email is required")
      return
    }
    if (!password) {
      setError("Password is required")
      return
    }

    try {
      const role = await login(email, password)
      router.push(role === "MANAGER" ? "/manager/dashboard" : "/employee/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
    }
  }

  return (
    <div className="flex min-h-dvh">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-accent-900 via-accent-700 to-accent-500 items-center justify-center p-12"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 h-48 w-48 rounded-full bg-white/[0.03] blur-2xl" />
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6"
          >
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-8 w-8 text-white"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.2" />
                <path
                  d="M10 16l4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-display font-bold text-white mb-4">Taskifier</h1>
            <p className="text-body text-accent-100/80 max-w-sm mx-auto leading-relaxed">
              Engineering team productivity platform. Track work, generate reports, and stay in
              sync with your team.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {["Productivity", "Reports", "Analytics", "AI Insights"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-caption text-accent-100/70"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <h2 className="text-h2 mb-2">Welcome back</h2>
              <p className="text-body-sm text-muted-foreground">
                Sign in to your account to continue
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="space-y-1.5"
            >
              <label htmlFor="email" className="text-body-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hasError={!!error}
                autoComplete="email"
                autoFocus
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-body-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-caption text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={!!error}
                autoComplete="current-password"
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-body-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 text-center text-caption text-muted-foreground"
          >
            Manager: <strong>manager@taskifier.dev</strong> / <strong>password123</strong>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
