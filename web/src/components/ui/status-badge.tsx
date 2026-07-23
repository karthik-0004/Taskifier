import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { variant: "success" | "warning" | "default" | "danger" | "accent"; label: string }> = {
  active: { variant: "success", label: "Active" },
  on_hold: { variant: "warning", label: "On Hold" },
  completed: { variant: "default", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
  planning: { variant: "accent", label: "Planning" },
  not_started: { variant: "default", label: "Not Started" },
  in_progress: { variant: "success", label: "In Progress" },
  APPROVED: { variant: "success", label: "Approved" },
  DRAFT: { variant: "warning", label: "Draft" },
  REJECTED: { variant: "danger", label: "Rejected" },
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase()
  const config = statusConfig[key] ?? statusConfig[status.toLowerCase()]
  if (config) return <Badge variant={config.variant}>{config.label}</Badge>
  return <Badge>{status}</Badge>
}
