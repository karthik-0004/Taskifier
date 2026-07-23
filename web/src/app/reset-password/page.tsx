"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { resetPassword } from "@/lib/api-hooks"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError("Invalid or missing reset token")
      return
    }
    if (!newPassword) {
      setError("New password is required")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="text-h2">Invalid Link</h2>
          <p className="text-body-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => router.push("/forgot-password")}>Request New Link</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 text-center">
          <h2 className="text-h2 mb-2">Reset Password</h2>
          <p className="text-body-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="rounded-xl bg-success/10 p-6">
              <p className="text-body-sm text-success font-medium">
                Password reset successfully! A confirmation email has been sent.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} variant="primary">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="New Password" required>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoFocus
              />
            </FormField>
            <FormField label="Confirm Password" required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </FormField>

            {error && (
              <p className="text-body-sm text-destructive">{error}</p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
