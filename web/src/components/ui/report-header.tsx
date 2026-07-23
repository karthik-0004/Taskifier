import { ArrowLeft } from "lucide-react"

interface ReportHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
}

export function ReportHeader({ title, subtitle, onBack, right }: ReportHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <h1 className="text-h1">{title}</h1>
        {subtitle && <p className="text-body-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
