import { type HTMLAttributes } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  "bg-accent/10 text-accent",
  "bg-success/10 text-success",
  "bg-destructive/10 text-destructive",
  "bg-warning/10 text-warning",
  "bg-muted text-muted-foreground",
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-8 text-caption",
  md: "size-10 text-body-sm",
  lg: "size-12 text-body",
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const initials = name ? getInitials(name) : "?"
  const colorClass = name ? hashColor(name) : "bg-muted text-muted-foreground"

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
        sizeClasses[size],
        !src && colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || ""}
          fill
          className="object-cover"
          sizes="48px"
        />
      ) : (
        <span className="font-medium leading-none">{initials}</span>
      )}
    </div>
  )
}
