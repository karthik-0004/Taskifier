"use client"

import { useId, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label?: string
  description?: string
}

export function Switch({ className, label, description, id, ...props }: SwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
        <input
          type="checkbox"
          role="switch"
          id={switchId}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "bg-input peer-checked:bg-accent",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-3.5 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200",
              "peer-checked:translate-x-4 peer-checked:bg-accent-foreground"
            )}
          />
        </span>
      </label>
      {(label || description) && (
        <div className="space-y-0.5">
          {label && (
            <label htmlFor={switchId} className="text-body-sm font-medium cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}