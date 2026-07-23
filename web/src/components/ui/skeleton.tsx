import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
}

const variantClasses = {
  text: "rounded-md h-4 w-full",
  circular: "rounded-full",
  rectangular: "rounded-xl",
}

export function Skeleton({
  variant = "text",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
