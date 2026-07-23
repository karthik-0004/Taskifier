import { CheckSquare } from "lucide-react"

interface TaskListProps {
  tasks: string[]
  max?: number
}

export function TaskList({ tasks, max }: TaskListProps) {
  const items = max ? tasks.slice(0, max) : tasks

  if (tasks.length === 0) {
    return <p className="text-caption text-muted-foreground">No tasks recorded</p>
  }

  return (
    <div className="space-y-1.5">
      {items.map((task, i) => (
        <div key={i} className="flex items-start gap-2 text-body-sm">
          <CheckSquare size={12} className="mt-0.5 shrink-0 text-success" />
          <span>{task}</span>
        </div>
      ))}
      {max && tasks.length > max && (
        <p className="text-caption text-muted-foreground">+{tasks.length - max} more</p>
      )}
    </div>
  )
}
