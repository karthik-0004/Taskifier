import { Calendar } from "lucide-react"

interface DateSelectorProps {
  value: string
  onChange: (date: string) => void
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  return (
    <div className="relative w-fit">
      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-48 rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-body-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:border-foreground/30 transition-colors"
      />
    </div>
  )
}
