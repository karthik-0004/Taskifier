import { Avatar } from "@/components/ui/avatar"

interface AvatarGroupProps {
  items: Array<{ id: string; name: string }>
  max?: number
  size?: "sm" | "md" | "lg"
}

export function AvatarGroup({ items, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = items.slice(0, max)
  const remaining = items.length - visible.length

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((item) => (
          <Avatar key={item.id} name={item.name} size={size} className="ring-2 ring-card" />
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-caption text-muted-foreground ml-2">+{remaining}</span>
      )}
    </div>
  )
}
