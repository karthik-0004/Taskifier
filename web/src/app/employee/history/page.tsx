"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/components/animations"
import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Drawer } from "@/components/ui/drawer"
import { useMySummaries, parseSummaryContent } from "@/lib/api-hooks"
import { useRouter } from "next/navigation"

function statusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>
    case "DRAFT":
      return <Badge variant="accent">Draft</Badge>
    case "REJECTED":
      return <Badge variant="danger">Rejected</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: summariesData, loading } = useMySummaries()

  const sorted = useMemo(() => {
    if (!summariesData) return []
    return [...summariesData]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((s) => ({
        ...s,
        parsed: parseSummaryContent(s.editedContent ?? s.aiGeneratedContent),
        dateStr: formatDate(s.date),
      }))
  }, [summariesData])

  const [selected, setSelected] = useState<(typeof sorted)[number] | null>(null)

  return (
    <>
      <div className="space-y-6">
        <PageHeader title="History" subtitle="Your past daily summaries" />

        {loading ? (
          <div className="max-w-2xl space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            message="No summaries yet"
            description="Your daily summaries will appear here once you start submitting them."
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl space-y-3"
          >
            {sorted.map((s) => (
              <motion.div key={s.id} variants={staggerItem}>
                <button
                  onClick={() => setSelected(s)}
                  className="w-full text-left rounded-xl border bg-card p-4 shadow-soft transition-all duration-150 hover:shadow-card hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-sm font-medium">{s.dateStr}</span>
                    {statusBadge(s.status)}
                  </div>
                  <p className="text-body-sm text-muted-foreground line-clamp-2">
                    {s.parsed.todayWork}
                  </p>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Summary — ${selected.dateStr}` : ""}
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name ?? ""} size="sm" />
              <div>
                <p className="text-body-sm font-medium">{user?.name}</p>
                {statusBadge(selected.status)}
              </div>
            </div>

            <div className="space-y-4 text-body-sm">
              <div>
                <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
                  Today&rsquo;s Work
                </span>
                <p className="mt-1 leading-relaxed">{selected.parsed.todayWork}</p>
              </div>
              <div>
                <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
                  In Progress
                </span>
                <p className="mt-1 leading-relaxed">{selected.parsed.inProgress}</p>
              </div>
              {selected.parsed.blockers && (
                <div>
                  <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
                    Blockers
                  </span>
                  <p className="mt-1 leading-relaxed">{selected.parsed.blockers}</p>
                </div>
              )}
              <div>
                <span className="text-caption font-medium text-muted-foreground tracking-wide uppercase">
                  Tomorrow
                </span>
                <p className="mt-1 leading-relaxed">{selected.parsed.tomorrow}</p>
              </div>
            </div>

            {selected.status === "DRAFT" && (
              <div className="pt-2">
                <Button
                  variant="accent"
                  onClick={() => {
                    router.push("/employee/daily-summary")
                    setSelected(null)
                  }}
                >
                  Edit Draft
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  )
}
