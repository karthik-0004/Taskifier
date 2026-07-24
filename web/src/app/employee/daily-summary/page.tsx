"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle2, ThumbsDown, PencilLine, FileText, Clock, Save, Send, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import {
  useMySummaries,
  generateSummary,
  editSummary,
  approveSummary,
  rejectSummary,
  parseSummaryContent,
  buildSummaryContent,
  createManualSummary,
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
        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
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
              <p className="text-[10px] text-muted-foreground mt-1">
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
              className="cursor-pointer rounded-lg -mx-1 px-2 py-1.5 transition-colors hover:bg-muted/50 border border-transparent hover:border-border/50"
            >
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {value || (
                  <span className="italic text-muted-foreground/50">
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
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  
  // Manual Tab State
  const [manualSummary, setManualSummary] = useState({
    todayWork: "",
    challenges: "",
    tomorrowPlan: "",
    notes: ""
  })

  useEffect(() => {
    if (summariesLoading) return
    const todaySum = (summariesData ?? []).find(
      (s: any) => {
        if (!s.date) return false
        const d = new Date(s.date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayDateStr()
      }
    )
    if (todaySum) {
      setCurrentSummaryId(todaySum.id)
      const parsed = parseSummaryContent(
        todaySum.editedContent ?? todaySum.aiGeneratedContent,
      )
      setSummary(parsed)
      
      // Load manual draft if it maps
      setManualSummary({
        todayWork: parsed.todayWork || "",
        challenges: parsed.blockers || "",
        tomorrowPlan: parsed.tomorrow || "",
        notes: parsed.inProgress || ""
      })

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

  function handleSubmitManual() {
    if (!manualSummary.todayWork.trim() && !manualSummary.challenges.trim() && !manualSummary.tomorrowPlan.trim() && !manualSummary.notes.trim()) {
      toast("Summary cannot be empty.", "error")
      return
    }

    const content = `Today's Work:\n${manualSummary.todayWork}\n\nBlockers:\n${manualSummary.challenges}\n\nTomorrow:\n${manualSummary.tomorrowPlan}\n\nIn Progress:\n${manualSummary.notes}`
    if (currentSummaryId) {
      editSummary(currentSummaryId, content).then(() => {
        handleApprove()
      }).catch((err) => toast(err.message, "error"))
    } else {
      createManualSummary(content).then(() => {
        setPageState("approved")
        refreshSummaries()
        toast("Manual summary submitted", "success")
      }).catch((err) => toast(err.message, "error"))
    }
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

  const pastSummaries = (summariesData ?? [])
    .filter((s: any) => {
      if (!s.date) return false
      const d = new Date(s.date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` !== todayDateStr()
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (pageState === "loading") {
    return (
      <div className="space-y-8 max-w-4xl">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-10 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Daily Summary</h1>
        <p className="text-muted-foreground mt-1">
          Record your day's work manually or let AI generate it based on your activity.
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-[400px]">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Today's Work</label>
                <Textarea 
                  placeholder="What did you accomplish today?" 
                  className="min-h-[100px] resize-y"
                  value={manualSummary.todayWork}
                  onChange={(e) => setManualSummary(prev => ({...prev, todayWork: e.target.value}))}
                  disabled={pageState === "approved"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Challenges & Blockers</label>
                <Textarea 
                  placeholder="Did you face any issues?" 
                  className="min-h-[80px] resize-y"
                  value={manualSummary.challenges}
                  onChange={(e) => setManualSummary(prev => ({...prev, challenges: e.target.value}))}
                  disabled={pageState === "approved"}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tomorrow's Plan</label>
                  <Textarea 
                    placeholder="What will you work on?" 
                    className="min-h-[80px] resize-y"
                    value={manualSummary.tomorrowPlan}
                    onChange={(e) => setManualSummary(prev => ({...prev, tomorrowPlan: e.target.value}))}
                    disabled={pageState === "approved"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Additional Notes</label>
                  <Textarea 
                    placeholder="Any extra context?" 
                    className="min-h-[80px] resize-y"
                    value={manualSummary.notes}
                    onChange={(e) => setManualSummary(prev => ({...prev, notes: e.target.value}))}
                    disabled={pageState === "approved"}
                  />
                </div>
              </div>

              {pageState !== "approved" ? (
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Button variant="accent" onClick={handleSubmitManual}>
                    <Send size={16} className="mr-2" /> Submit Summary
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border/50 text-success flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 size={16} /> Summary Submitted Successfully
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <AnimatePresence mode="wait">
            {pageState === "empty" && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-xl border border-dashed px-8 py-16 text-center bg-card shadow-sm">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Generate AI Summary</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                    We&rsquo;ll compile your commits, PRs, and time tracking into a professional summary.
                  </p>
                  <Button variant="accent" size="lg" onClick={handleGenerate}>
                    <Sparkles size={16} className="mr-2" />
                    Generate Summary
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
              >
                <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Analyzing your workspace activity...</span>
                  </div>
                  <div className="space-y-6">
                    <ShimmerBlock label="Today's Work" lines={3} />
                    <ShimmerBlock label="In Progress" lines={2} />
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
              >
                <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-accent shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">AI Draft ready.</span> Click any section below to edit before approving.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <EditableSection
                      label="Today's Work"
                      value={summary.todayWork}
                      onChange={(v) => updateSection("todayWork", v)}
                    />
                    <div className="border-t border-border/50" />
                    <EditableSection
                      label="In Progress"
                      value={summary.inProgress}
                      onChange={(v) => updateSection("inProgress", v)}
                    />
                    <div className="border-t border-border/50" />
                    <EditableSection
                      label="Blockers"
                      value={summary.blockers}
                      onChange={(v) => updateSection("blockers", v)}
                    />
                    <div className="border-t border-border/50" />
                    <EditableSection
                      label="Tomorrow"
                      value={summary.tomorrow}
                      onChange={(v) => updateSection("tomorrow", v)}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Button variant="accent" onClick={handleApprove}>
                      <CheckCircle2 size={16} className="mr-2" /> Approve & Submit
                    </Button>
                    <Button variant="ghost" onClick={handleReject} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Discard
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
              >
                <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-success/10 text-success"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h2 className="text-2xl font-semibold mb-2">Summary Submitted</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                    Your daily summary is with your manager. You can still revise it if you need to add something.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => setPageState("review")}>
                      <PencilLine size={14} className="mr-2" /> Edit Summary
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Previous Summaries */}
      <div className="pt-10 border-t border-border/40">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <Clock size={18} className="text-muted-foreground" /> Previous Summaries
        </h2>
        {pastSummaries.length === 0 ? (
          <div className="rounded-xl border bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No past summaries found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastSummaries.map((s: any) => {
              const d = new Date(s.date)
              const dateStr = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              })
              const content = s.editedContent || s.aiGeneratedContent
              return (
                <Card key={s.id} className="shadow-sm border-border/60 hover:border-primary/20 transition-colors">
                  <CardHeader className="py-3 px-4 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-sm font-semibold">{dateStr}</CardTitle>
                      <Badge variant={s.status === "APPROVED" ? "success" : "secondary"} className="text-[10px]">
                        {s.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                      View <ChevronRight size={14} />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {content.replace(/\n/g, ' ')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ShimmerBlock({ label, lines }: { label: string; lines: number }) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? "w-3/4" : "w-full h-4"}
        />
      ))}
    </div>
  )
}
