import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AISummaryCardProps {
  text: string | null
  title?: string
  compact?: boolean
}

export function AISummaryCard({ text, title = "AI Summary", compact = false }: AISummaryCardProps) {
  if (!text) return null

  return (
    <Card className={compact ? "bg-accent/5 border-accent/20" : "bg-accent/5 border-accent/20"}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={compact ? 12 : 14} className="text-accent" />
          <span className={`font-medium text-accent ${compact ? "text-caption" : "text-body-sm"}`}>{title}</span>
        </div>
        <p className={`text-foreground leading-relaxed whitespace-pre-wrap ${compact ? "text-caption" : "text-body-sm"}`}>{text}</p>
      </CardContent>
    </Card>
  )
}
