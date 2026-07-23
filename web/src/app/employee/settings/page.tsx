"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { slideUp } from "@/components/animations"
import { User, Shield, Lock, Save } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/toast"
import { updateProfile, changePassword } from "@/lib/api-hooks"

export default function SettingsPage() {
  const { user, login } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "")
  const [position, setPosition] = useState(user?.position ?? "")
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await updateProfile({ name, phoneNumber: phoneNumber || undefined, position: position || undefined })
      toast("Profile updated successfully", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update profile", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast("All password fields are required", "error")
      return
    }
    if (newPassword.length < 6) {
      toast("New password must be at least 6 characters", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error")
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast("Password changed successfully. A confirmation email has been sent.", "success")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to change password", "error")
    } finally {
      setChangingPassword(false)
    }
  }

  function handleProfilePictureClick() {
    fileInputRef.current?.click()
  }

  async function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      try {
        await updateProfile({ profilePicture: dataUrl })
        toast("Profile picture updated", "success")
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to update profile picture", "error")
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Profile & Security"
        subtitle="Manage your personal information and account security"
      />

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border bg-card p-5 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <User size={16} />
          <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">Personal Information</span>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button onClick={handleProfilePictureClick} className="relative group">
            <Avatar name={user?.name ?? ""} size="lg" src={user?.profilePicture ?? undefined} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-caption text-white font-medium">Edit</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
          <div className="space-y-1">
            <p className="text-body font-medium">{user?.name}</p>
            <p className="text-body-sm text-muted-foreground">{user?.email}</p>
            <p className="text-caption text-muted-foreground">
              Role: <span className="capitalize">{user?.role?.toLowerCase()}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <FormField label="Full Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </FormField>
          <FormField label="Email">
            <Input value={user?.email ?? ""} disabled placeholder="Email cannot be changed" />
          </FormField>
          <FormField label="Phone Number">
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
          </FormField>
          <FormField label="Position">
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <option value="">Select position</option>
              <option value="Developer">Developer</option>
              <option value="Tester">Tester</option>
              <option value="Designer">Designer</option>
              <option value="DevOps">DevOps</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border bg-card p-5 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Lock size={16} />
          <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">Account Security</span>
        </div>

        <div className="space-y-4 pt-1">
          <FormField label="Current Password">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </FormField>
          <FormField label="New Password">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </FormField>
          <FormField label="Confirm New Password">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </FormField>
          <div className="flex justify-end pt-2">
            <Button
              variant="accent"
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              <Shield size={16} />
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
