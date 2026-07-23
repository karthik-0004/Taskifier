import { useId, cloneElement, isValidElement, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FormField({ label, error, required, className, children }: FormFieldProps) {
  const generatedId = useId()

  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id: generatedId })
    : children

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={generatedId} className="text-body-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {child}
      {error && (
        <p className="text-caption text-destructive">{error}</p>
      )}
    </div>
  )
}
