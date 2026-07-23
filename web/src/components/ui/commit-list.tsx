import { GitCommit } from "lucide-react"

interface Commit {
  id: string
  message?: string
  hash?: string
  timestamp: string
}

interface CommitListProps {
  commits: Commit[]
  max?: number
}

export function CommitList({ commits, max }: CommitListProps) {
  const items = max ? commits.slice(0, max) : commits

  if (commits.length === 0) {
    return <p className="text-caption text-muted-foreground">No commits</p>
  }

  return (
    <div className="space-y-1.5">
      {items.map((c) => (
        <div key={c.id} className="flex items-start gap-2 text-body-sm">
          <GitCommit size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-mono text-caption text-muted-foreground">
              {c.hash ?? c.id.slice(0, 7)}
            </p>
            {c.message && <p className="truncate">{c.message}</p>}
          </div>
        </div>
      ))}
      {max && commits.length > max && (
        <p className="text-caption text-muted-foreground">+{commits.length - max} more</p>
      )}
    </div>
  )
}
