"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { slideUp } from "@/components/animations"
import { User, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Switch } from "@/components/ui/switch"
import { Avatar } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { user } = useAuth()

  const [prefs, setPrefs] = useState({
    includeFilePaths: false,
    includeVerbatimCommits: true,
    autoGenerate: false,
  })

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Your account and privacy preferences"
      />

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border bg-card p-5 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <User size={16} />
          <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">Profile</span>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <Avatar name={user?.name ?? ""} size="lg" />
          <div className="space-y-1">
            <p className="text-body font-medium">{user?.name}</p>
            <p className="text-body-sm text-muted-foreground">{user?.email}</p>
            <p className="text-caption text-muted-foreground">
              Role: <span className="capitalize">{user?.role?.toLowerCase()}</span>
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border bg-card p-5 shadow-soft space-y-5"
      >
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Shield size={16} />
          <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">Privacy &amp; AI Preferences</span>
        </div>

        <Switch
          label="Include file paths in AI summaries"
          description="When generating your daily summary, the AI can reference specific file paths from your commits. Disable this if you'd prefer broader descriptions without source locations."
          checked={prefs.includeFilePaths}
          onChange={(e) => setPrefs((p) => ({ ...p, includeFilePaths: e.target.checked }))}
        />

        <div className="border-t" />

        <Switch
          label="Include commit messages verbatim"
          description="Your commit messages may contain internal context or shorthand. Keep this on to help the AI write accurate summaries, or turn it off for more abstracted descriptions."
          checked={prefs.includeVerbatimCommits}
          onChange={(e) => setPrefs((p) => ({ ...p, includeVerbatimCommits: e.target.checked }))}
        />

        <div className="border-t" />

        <Switch
          label="Auto-generate summary at end of day"
          description="When enabled, the AI will draft your summary automatically around end of day. You'll still review and approve before it's sent to your manager. Turn off if you prefer to generate summaries manually."
          checked={prefs.autoGenerate}
          onChange={(e) => setPrefs((p) => ({ ...p, autoGenerate: e.target.checked }))}
        />
      </motion.div>
    </div>
  )
}