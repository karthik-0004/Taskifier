"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { slideUp } from "@/components/animations"
import {
  GitBranch,
  Code2,
  CheckCircle2,
  Link2,
  Unlink,
  ExternalLink,
  Terminal,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

export default function ConnectionsPage() {
  const { toast } = useToast()

  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState("")

  function handleGithubConnect() {
    toast("Redirecting to GitHub authorization...", "info")
    setTimeout(() => {
      setGithubConnected(true)
      setGithubUsername("jordan-dev")
      toast("GitHub connected successfully", "success")
    }, 1200)
  }

  function handleGithubDisconnect() {
    setGithubConnected(false)
    setGithubUsername("")
    toast("GitHub disconnected", "info")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        subtitle="Connect your accounts and tools"
      />

      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="max-w-xl space-y-4"
      >
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#24292f] text-white">
                <GitBranch size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-body font-medium">GitHub</h3>
                  {githubConnected ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 size={10} />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="default">Not connected</Badge>
                  )}
                </div>
                <p className="text-body-sm text-muted-foreground">
                  {githubConnected
                    ? `Connected as ${githubUsername}`
                    : "Link your GitHub account to track commits, PRs, and activity automatically."}
                </p>
                {githubConnected && (
                  <div className="flex items-center gap-1.5 mt-2 text-caption text-muted-foreground">
                    <ExternalLink size={12} />
                    <span>{githubUsername}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant={githubConnected ? "destructive" : "accent"}
              size="sm"
              onClick={githubConnected ? handleGithubDisconnect : handleGithubConnect}
            >
              {githubConnected ? (
                <>
                  <Unlink size={14} />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 size={14} />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Code2 size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-body font-medium">VS Code Extension</h3>
                  <Badge variant="default">Not connected</Badge>
                </div>
                <p className="text-body-sm text-muted-foreground">
                  Track your coding activity and sessions directly from your editor. The extension
                  is coming soon.
                </p>
                <div className="mt-3 rounded-xl bg-muted/50 border px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-medium text-foreground">
                    <Terminal size={14} />
                    <span>Setup instructions</span>
                  </div>
                  <ol className="space-y-1.5 text-body-sm text-muted-foreground ml-5 list-decimal">
                    <li>Install the Taskifier extension from the VS Code marketplace</li>
                    <li>
                      Open the Command Palette (Ctrl+Shift+P) and run &ldquo;Taskifier: Sign
                      In&rdquo;
                    </li>
                    <li>Authenticate with your Taskifier account</li>
                    <li>Your editor activity will sync automatically</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
