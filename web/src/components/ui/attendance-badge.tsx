import { Clock } from "lucide-react"

interface AttendanceBadgeProps {
  checkIn: string | null
  checkOut: string | null
  totalMinutes: number
}

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function AttendanceBadge({ checkIn, checkOut, totalMinutes }: AttendanceBadgeProps) {
  return (
    <div className="flex items-center gap-3 text-body-sm">
      <div className="flex items-center gap-1">
        <Clock size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground">In:</span>
        <span className="font-medium tabular-nums">{formatTime(checkIn)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground">Out:</span>
        <span className="font-medium tabular-nums">{formatTime(checkOut)}</span>
      </div>
      <span className="text-caption font-mono text-muted-foreground">{formatHours(totalMinutes)}</span>
    </div>
  )
}
