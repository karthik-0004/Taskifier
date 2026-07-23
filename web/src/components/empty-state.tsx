import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  message: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-muted-foreground/50">{icon}</div>
      )}
      <p className="text-body font-medium text-foreground">{message}</p>
      {description && (
        <p className="text-body-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
