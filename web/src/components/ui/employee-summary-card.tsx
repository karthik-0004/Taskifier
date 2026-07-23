import { Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AttendanceBadge } from "@/components/ui/attendance-badge"
import { AISummaryCard } from "@/components/ui/ai-summary-card"
import type { ProjectDailyEmployeeDTO } from "@/lib/api-hooks"

interface EmployeeSummaryCardProps {
  employee: ProjectDailyEmployeeDTO
  onViewDetails: (userId: string) => void
}

export function EmployeeSummaryCard({ employee, onViewDetails }: EmployeeSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="md" />
            <div>
              <p className="text-body-sm font-semibold">{employee.name}</p>
              <p className="text-caption text-muted-foreground">{employee.position ?? "—"}</p>
            </div>
          </div>
          <Badge variant="accent">{employee.role.replace(/_/g, " ")}</Badge>
        </div>

        <AttendanceBadge checkIn={employee.checkIn} checkOut={employee.checkOut} totalMinutes={employee.totalMinutes} />

        <div className="flex items-center gap-4 text-body-sm">
          <div>
            <span className="text-muted-foreground">Commits: </span>
            <span className="font-medium tabular-nums">{employee.commitCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Files: </span>
            <span className="font-medium tabular-nums">{employee.fileEditCount}</span>
          </div>
        </div>

        <AISummaryCard text={employee.summaryContent} compact />

        <Button variant="secondary" size="sm" className="w-full" onClick={() => onViewDetails(employee.userId)}>
          <Eye size={12} /> View Details
        </Button>
      </CardContent>
    </Card>
  )
}
