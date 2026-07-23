import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface MetricsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: string; positive: boolean }
}

export function MetricsCard({ label, value, icon, trend }: MetricsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between">
        <div>
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="text-h2 mt-1">{value}</p>
          {trend && (
            <p className={`text-caption mt-1 ${trend.positive ? "text-success" : "text-danger"}`}>
              {trend.value}
            </p>
          )}
        </div>
        {icon && <div className="text-muted-foreground/40 mt-1">{icon}</div>}
      </CardContent>
    </Card>
  )
}
