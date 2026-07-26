"use client"

import { useEffect, useState, FormEvent } from "react"
import { motion } from "framer-motion"
import { Shield, Plus, X, Trash2, Check, AlertCircle, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { FormField } from "@/components/ui/form-field"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { createUser, updateUser } from "@/lib/api-hooks"
import { api } from "@/lib/api"

const AVAILABLE_PERMISSIONS = [
  { id: "MANAGE_MEMBERS", label: "Manage Members", desc: "Can manage general member settings" },
  { id: "CREATE_ROLES", label: "Create Roles", desc: "Can create and delete custom organization roles" },
  { id: "INVITE_EMPLOYEES", label: "Invite Employees", desc: "Can invite new users to the organization" },
  { id: "MANAGE_PROJECTS", label: "Manage Projects", desc: "Can create and delete projects" },
  { id: "VIEW_TEAM_SUMMARIES", label: "View Team Summaries", desc: "Can view daily work summaries of employees" },
  { id: "VIEW_REPORTS", label: "View Reports", desc: "Can view weekly AI-generated reports" },
  { id: "MANAGE_ATTENDANCE", label: "Manage Attendance", desc: "Can view and manage employee attendance logs" },
]

export default function RolesManagementPage() {
  const { accessToken } = useAuth()
  const [roles, setRoles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Form State
  const [isCreating, setIsCreating] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Invite Member State
  const [inviteRole, setInviteRole] = useState<any>(null)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPosition, setNewPosition] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  
  // View Members State
  const [viewRole, setViewRole] = useState<any>(null)

  function generateTempPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$"
    let pwd = ""
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd
  }

  const handleOpenInvite = (role: any) => {
    setInviteRole(role)
    setGeneratedPassword(generateTempPassword())
  }

  const handleInvite = async () => {
    if (!newName.trim() || !newEmail.trim() || !inviteRole) {
      toast("Name and email are required", "error")
      return
    }
    
    try {
      await createUser(newName.trim(), newEmail.trim(), generatedPassword, inviteRole.id, newPhone.trim() || undefined, newPosition.trim() || undefined)
      toast(`User invited as ${inviteRole.name}! Password: ${generatedPassword}`, "success")
      setInviteRole(null)
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewPosition("")
      fetchRoles() // update counts
    } catch (err: any) {
      toast(err.message, "error")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this user from the role? They will become a standard employee.")) return
    try {
      await updateUser(userId, { organizationRoleId: null })
      toast("User removed from role", "success")
      
      // Update local state so popup updates immediately
      if (viewRole) {
        setViewRole({
          ...viewRole,
          users: viewRole.users.filter((u: any) => u.id !== userId)
        })
      }
      
      fetchRoles()
    } catch (err: any) {
      toast(err.message, "error")
    }
  }

  const fetchRoles = async () => {
    try {
      const data = await api<any[]>("/organization/roles")
      setRoles(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) fetchRoles()
  }, [accessToken])

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  const handleCreateRole = async (e: FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      await api("/organization/roles", {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName, permissions: selectedPermissions })
      })
      
      await fetchRoles()
      setIsCreating(false)
      setNewRoleName("")
      setSelectedPermissions([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      await api(`/organization/roles/${roleId}`, {
        method: 'DELETE'
      })
      
      await fetchRoles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading roles...</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold mb-1">Role Management</h1>
          <p className="text-body-sm text-muted-foreground">
            Create custom roles and assign granular permissions for your organization.
          </p>
        </div>
        
        {!isCreating && (
          <Button variant="primary" onClick={() => setIsCreating(true)} className="gap-2 shrink-0">
            <Plus size={16} /> New Role
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="bg-card border border-border rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h3">Create Custom Role</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-muted-foreground">
              <X size={20} />
            </Button>
          </div>

          <form onSubmit={handleCreateRole} className="space-y-8">
            <div className="space-y-2 max-w-sm">
              <label className="text-body-sm font-medium">Role Name</label>
              <Input 
                placeholder="e.g. CTO, Team Lead, HR Manager" 
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-body-sm font-medium">Assign Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isSelected = selectedPermissions.includes(perm.id)
                  return (
                    <div 
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-accent bg-accent/5' 
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className={`mt-0.5 flex shrink-0 h-5 w-5 items-center justify-center rounded border ${
                        isSelected ? 'bg-accent border-accent text-white' : 'border-input'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div>
                        <p className={`text-body-sm font-medium ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                          {perm.label}
                        </p>
                        <p className="text-caption text-muted-foreground mt-0.5 leading-snug">
                          {perm.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!newRoleName || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <motion.div 
            key={role.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setViewRole(role)}
            className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:shadow-soft hover:border-accent/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-body leading-none">{role.name}</h3>
                  <p className="text-caption text-muted-foreground mt-1">
                    {role._count.users} Member{role._count.users !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleOpenInvite(role)}
                  className="text-muted-foreground hover:text-accent hover:bg-accent/10 h-8 px-2"
                  title="Invite Member to this Role"
                >
                  <UserPlus size={16} />
                </Button>
                {!role.isOwnerRole && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    title="Delete Role"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 mt-2">
              <p className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Permissions
              </p>
              {role.permissions.length === 0 ? (
                <p className="text-body-sm text-muted-foreground italic">No special permissions.</p>
              ) : (
                role.permissions.map((p: any) => {
                  const permDef = AVAILABLE_PERMISSIONS.find(def => def.id === p.permissionKey)
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-body-sm">
                      <Check size={14} className="text-success shrink-0" />
                      <span className="truncate">{permDef?.label || p.permissionKey}</span>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={!!inviteRole} onClose={() => setInviteRole(null)} title={`Invite ${inviteRole?.name}`}>
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Email Address" required>
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@company.com" />
          </FormField>
          <FormField label="Phone Number">
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
          </FormField>
          <FormField label="Job Title (Optional)">
            <Input value={newPosition} onChange={(e) => setNewPosition(e.target.value)} placeholder="e.g. Senior Frontend Developer" />
          </FormField>
          <FormField label="Temporary Password" required>
            <div className="flex gap-2">
              <Input 
                value={generatedPassword} 
                onChange={(e) => setGeneratedPassword(e.target.value)}
                placeholder="Enter password"
                className="font-mono text-body-sm" 
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setGeneratedPassword(generateTempPassword())}
                type="button"
              >
                Generate
              </Button>
            </div>
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setInviteRole(null)} type="button">Cancel</Button>
            <Button variant="accent" onClick={handleInvite} disabled={!newName.trim() || !newEmail.trim() || !generatedPassword.trim()}>Send Invite</Button>
          </div>
        </div>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={!!viewRole} onClose={() => setViewRole(null)} title={`${viewRole?.name} Members`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {viewRole?.users && viewRole.users.length > 0 ? (
            viewRole.users.map((u: any) => (
              <div key={u.id} className="p-4 rounded-xl border bg-card flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-body">{u.name}</div>
                  <div className="text-body-sm text-muted-foreground">{u.email}</div>
                  {u.phoneNumber && (
                    <div className="text-caption text-muted-foreground mt-1">
                      Phone: {u.phoneNumber}
                    </div>
                  )}
                </div>
                {!viewRole.isOwnerRole && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveMember(u.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title="Remove from Role"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl">
              No members found in this role.
            </div>
          )}
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button variant="secondary" onClick={() => setViewRole(null)}>Close</Button>
        </div>
      </Dialog>
    </div>
  )
}
