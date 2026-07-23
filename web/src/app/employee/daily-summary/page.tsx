"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle2, ThumbsDown, PencilLine, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import {
  useMySummaries,
  generateSummary,
  editSummary,
  approveSummary,
  rejectSummary,
  parseSummaryContent,
  buildSummaryContent,
  type ParsedSummary,
} from "@/lib/api-hooks"

type PageState = "loading" | "empty" | "generating" | "review" | "approved"

function EditableSection({
  label,
  value,
  onChange,
  initialEdit,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  initialEdit?: boolean
}) {
  const [editing, setEditing] = useState(initialEdit ?? false)
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        if (editing) {
          onChange(draft)
          setEditing(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [editing, draft, onChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setDraft(value)
      setEditing(false)
    }
    if (e.key === "Enter" && !e.shiftKey) {
      onChange(draft)
      setEditing(false)
    }
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${label}`}
          >
            <PencilLine size={12} />
          </button>
        )}
      </div>
      <div ref={inputRef}>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="textarea"
              initial={{ height: 40, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 40, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px]"
              />
              <p className="text-caption text-muted-foreground mt-1">
                Esc to cancel &middot; Enter to save
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-muted/50"
            >
              <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {value || (
                  <span className="italic text-muted-foreground/60">
                    Click to add content
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DailySummaryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: summariesData, loading: summariesLoading, refresh: refreshSummaries } = useMySummaries()

  const [pageState, setPageState] = useState<PageState>("loading")
  const [summary, setSummary] = useState<ParsedSummary>({
    todayWork: "",
    inProgress: "",
    blockers: "",
    tomorrow: "",
  })
  const [currentSummaryId, setCurrentSummaryId] = useState<string | null>(null)

  useEffect(() => {
    if (summariesLoading) return
    const todaySum = (summariesData ?? []).find(
      (s) => s.date?.slice(0, 10) === todayDateStr(),
    )
    if (todaySum) {
      setCurrentSummaryId(todaySum.id)
      const parsed = parseSummaryContent(
        todaySum.editedContent ?? todaySum.aiGeneratedContent,
      )
      setSummary(parsed)
      setPageState(todaySum.status === "APPROVED" ? "approved" : "review")
    } else {
      setPageState("empty")
    }
  }, [summariesData, summariesLoading])

  function handleGenerate() {
    setPageState("generating")
    generateSummary()
      .then((result) => {
        setCurrentSummaryId(result.id)
        const parsed = parseSummaryContent(result.aiGeneratedContent)
        setSummary(parsed)
        setPageState("review")
        refreshSummaries()
        toast("Summary generated — please review before approving", "info")
      })
      .catch((err) => {
        setPageState("empty")
        toast(err.message, "error")
      })
  }

  function handleApprove() {
    if (!currentSummaryId) return
    approveSummary(currentSummaryId)
      .then(() => {
      setPageState("approved")
        refreshSummaries()
        toast("Summary submitted to your manager", "success")
      })
      .catch((err) => toast(err.message, "error"))
  }

  function handleReject() {
    if (!currentSummaryId) return
    rejectSummary(currentSummaryId)
      .then(() => {
        toast("Summary rejected — edit and try again", "info")
        refreshSummaries()
      })
      .catch((err) => toast(err.message, "error"))
  }

  function updateSection(key: keyof ParsedSummary, value: string) {
    setSummary((prev) => {
      const next = { ...prev, [key]: value }
      return next
    })
    if (currentSummaryId) {
      const content = buildSummaryContent({ ...summary, [key]: value })
      editSummary(currentSummaryId, content).catch(() => {})
    }
  }

  if (pageState === "loading") {
    return (
      <div className="max-w-2xl space-y-8">
        <div>
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-96 mt-2" />
        </div>
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <AnimatePresence mode="wait">
        {pageState === "empty" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-h1">Daily Summary</h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                Let AI draft your summary — review and approve before it&rsquo;s sent to your
                manager.
              </p>
            </div>
            <div className="rounded-xl border border-dashed px-8 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <FileText size={24} />
              </div>
              <h2 className="text-h3 mb-2">No summary yet for today</h2>
              <p className="text-body-sm text-muted-foreground max-w-sm mx-auto mb-6">
                We&rsquo;ll look at your commits, PRs, branches, and activity to draft a summary.
                You stay in control — review and edit before it goes to your manager.
              </p>
              <Button variant="accent" size="lg" onClick={handleGenerate}>
                <Sparkles size={16} />
                Generate Today&rsquo;s Summary
              </Button>
            </div>
          </motion.div>
        )}

        {pageState === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-h1">Daily Summary</h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                Generating from your activity&hellip;
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-soft space-y-5">
              <div className="flex items-center gap-2 text-caption text-accent">
                <Sparkles size={12} className="animate-pulse" />
                <span>AI is drafting your summary</span>
              </div>
              <div className="space-y-4">
                <ShimmerBlock label="Today&rsquo;s Work" lines={3} />
                <ShimmerBlock label="In Progress" lines={2} />
                <ShimmerBlock label="Blockers" lines={1} />
                <ShimmerBlock label="Tomorrow" lines={2} />
              </div>
            </div>
          </motion.div>
        )}

        {pageState === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-h1">Daily Summary</h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                Review, edit, then approve to send to your manager.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-soft space-y-6">
              <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/10 px-4 py-3">
                <Sparkles size={14} className="text-accent shrink-0" />
                <p className="text-body-sm text-muted-foreground">
                  <span className="font-medium text-foreground">AI-generated</span> &mdash; review
                  before approving. Click any section to edit.
                </p>
              </div>

              <div className="space-y-5">
                <EditableSection
                  label="Today&rsquo;s Work"
                  value={summary.todayWork}
                  onChange={(v) => updateSection("todayWork", v)}
                />
                <div className="border-t" />
                <EditableSection
                  label="In Progress"
                  value={summary.inProgress}
                  onChange={(v) => updateSection("inProgress", v)}
                />
                <div className="border-t" />
                <EditableSection
                  label="Blockers"
                  value={summary.blockers}
                  onChange={(v) => updateSection("blockers", v)}
                />
                <div className="border-t" />
                <EditableSection
                  label="Tomorrow"
                  value={summary.tomorrow}
                  onChange={(v) => updateSection("tomorrow", v)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={handleApprove}
                  className="flex-1"
                >
                  <CheckCircle2 size={16} />
                  Approve &amp; Send
                </Button>
                <Button variant="destructive" size="lg" onClick={handleReject}>
                  <ThumbsDown size={16} />
                  Reject
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {pageState === "approved" && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="rounded-xl border bg-card p-10 text-center shadow-soft">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success"
              >
                <CheckCircle2 size={28} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <h2 className="text-h2 mb-2">Summary sent to your manager</h2>
                <p className="text-body-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Your manager will review it. You&rsquo;ll be notified if they have questions or
                  feedback.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="accent" onClick={() => setPageState("review")}>
                    <PencilLine size={14} />
                    Edit Again
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/employee/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShimmerBlock({ label, lines }: { label: string; lines: number }) {
  return (
    <div className="space-y-2">
      <span className="block text-caption font-medium text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  )
}
