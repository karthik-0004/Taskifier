"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number
  format?: (n: number) => string
  icon?: ReactNode
  trend?: { value: number; positive: boolean }
  prefix?: string
  suffix?: string
  className?: string
}

function AnimatedValue({
  value,
  format,
  prefix,
  suffix,
}: {
  value: number
  format?: (n: number) => string
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplay(current)
      if (step >= steps) {
        setDisplay(value)
        clearInterval(timer)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span ref={ref}>
      {prefix}
      {format ? format(display) : Math.round(display).toLocaleString()}
      {suffix}
    </span>
  )
}

export function StatCard({
  label,
  value,
  format,
  icon,
  trend,
  prefix,
  suffix,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-soft transition-all duration-200 hover:shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-body-sm text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-h2 font-semibold tabular-nums">
          <AnimatedValue value={value} format={format} prefix={prefix} suffix={suffix} />
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-caption font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            <motion.svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              initial={{ rotate: trend.positive ? -90 : 90 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <path d={trend.positive ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
            </motion.svg>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}
