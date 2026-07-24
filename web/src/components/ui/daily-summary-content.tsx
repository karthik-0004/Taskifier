"use client"

import { useEffect, useState } from "react"
import { ExternalLink, GitCommit, FileEdit, Clock, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"

interface DailySummaryContentProps {
  employeeId: string
  selectedDate: string | null
}

export function DailySummaryContent({ employeeId, selectedDate }: DailySummaryContentProps) {
  const { toast } = useToast()
  const [dailyDetails, setDailyDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (!selectedDate || !employeeId) return
    const fetchDetails = async () => {
      try {
        setLoadingDetails(true)
        const res = await fetch(`/api/employees/${employeeId}/daily-summary?date=${selectedDate}`)
        if (res.ok) {
          const data = await res.json()
          setDailyDetails(data)
        } else {
          toast("Failed to load daily details", "error")
        }
      } catch (err) {
        toast("Error loading daily details", "error")
      } finally {
        setLoadingDetails(false)
      }
    }
    fetchDetails()
  }, [selectedDate, employeeId, toast])

  if (loadingDetails || !dailyDetails) {
    return (
      <div className="space-y-4 h-full">
        <Skeleton variant="text" className="h-8 w-48 mb-4" />
        <Skeleton variant="rectangular" className="h-32 w-full" />
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    )
  }

  const d = new Date(selectedDate!)
  const displayDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const { attendance, checkIn, checkOut, workingHours, commits, fileEdits, timeline, summary } = dailyDetails

  if (attendance === "absent" || attendance === "weekend" || attendance === "holiday") {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center space-y-4 py-20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
          <ExternalLink size={24} />
        </div>
        <h3 className="text-xl font-semibold">Employee was {attendance}</h3>
        <p className="text-muted-foreground text-sm">
          No commits found. No work updates available on this day.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h3 className="text-2xl font-semibold mb-1">{displayDate}</h3>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Present
          </div>
          {checkIn && checkOut && (
            <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-foreground">
              {checkIn} - {checkOut}
            </div>
          )}
          <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-foreground">
            {workingHours}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <GitCommit size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commits</p>
              <p className="font-semibold">{commits?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <FileEdit size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Files Edited</p>
              <p className="font-semibold">{fileEdits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <Activity size={80} />
          </div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-primary">
            <Activity size={16} /> AI Daily Summary
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Commits */}
      {commits && commits.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <GitCommit size={16} className="text-muted-foreground" /> Commits
          </h4>
          <div className="space-y-2">
            {commits.map((c: any, index: number) => (
              <div key={c.id || index} className="text-sm p-3 border rounded-lg bg-card/30 flex items-start gap-3">
                <div className="mt-0.5 text-green-500">✔</div>
                <div className="flex-1">{c.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" /> Work Updates
          </h4>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {timeline.map((item: any, i: number) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-background bg-muted-foreground absolute left-0 md:left-1/2 -translate-x-1/2 group-hover:bg-primary group-hover:border-primary/30 transition-colors shadow-sm"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border bg-card/50 shadow-sm ml-8 md:ml-0 group-hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                    <Clock size={12} /> {item.time}
                  </div>
                  <p className="text-sm">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
