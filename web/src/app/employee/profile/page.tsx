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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { updateProfile, changePassword } from "@/lib/api-hooks"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "")
  const [position, setPosition] = useState(user?.position ?? "")
  const [department, setDepartment] = useState("")
  const [github, setGithub] = useState("")
  const [cursorAccount, setCursorAccount] = useState("")

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
    <div className="max-w-4xl space-y-6 pb-12">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information and account security"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Avatar */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="col-span-1"
        >
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <button onClick={handleProfilePictureClick} className="relative group mx-auto block">
                <Avatar name={user?.name ?? ""} src={user?.profilePicture ?? undefined} className="h-28 w-28 text-3xl shadow-sm" />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium uppercase tracking-wider">Change</span>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
              
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20 capitalize">
                    {user?.role?.toLowerCase()}
                  </span>
                  {position && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                      {position}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Col: Forms */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="col-span-1 md:col-span-2 space-y-6"
        >
          <Card className="shadow-sm border-border/60">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={18} className="text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Full Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                </FormField>
                <FormField label="Email">
                  <Input value={user?.email ?? ""} disabled placeholder="Email cannot be changed" className="bg-muted/30" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Phone Number">
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
                </FormField>
                <FormField label="Role">
                  <Input value={user?.role ?? ""} disabled className="capitalize bg-muted/30" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Department">
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" />
                </FormField>
                <FormField label="Position">
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="GitHub Username">
                  <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="octocat" />
                </FormField>
                <FormField label="Cursor Account">
                  <Input value={cursorAccount} onChange={(e) => setCursorAccount(e.target.value)} placeholder="cursor_user" />
                </FormField>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save size={16} className="mr-2" />
                  {saving ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield size={18} className="text-accent" /> Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <FormField label="Current Password">
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pl-9 max-w-sm"
                  />
                </div>
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                <FormField label="New Password">
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pl-9"
                    />
                  </div>
                </FormField>
                <FormField label="Confirm New Password">
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="pl-9"
                    />
                  </div>
                </FormField>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button
                  variant="accent"
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  <Shield size={16} className="mr-2" />
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
