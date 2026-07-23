import { ChevronLeft, ChevronRight } from "lucide-react"

function getWeekRange(date: Date): { start: string; end: string; label: string } {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
    label: `${fmt(monday)} - ${fmt(sunday)}`,
  }
}

interface WeekSelectorProps {
  weekStart: string
  onChange: (weekStart: string) => void
}

export function WeekSelector({ weekStart, onChange }: WeekSelectorProps) {
  const current = getWeekRange(new Date(weekStart + "T00:00:00"))

  function shift(days: number) {
    const d = new Date(weekStart + "T00:00:00")
    d.setDate(d.getDate() + days)
    onChange(d.toISOString().slice(0, 10))
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-7)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="text-body-sm font-medium min-w-[240px] text-center">{current.label}</span>
      <button onClick={() => shift(7)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
