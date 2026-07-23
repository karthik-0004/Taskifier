"use client"

import {
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

interface HorizontalScrollerProps {
  children: ReactNode
  className?: string
  itemClassName?: string
}

export function HorizontalScroller({
  children,
  className,
  itemClassName,
}: HorizontalScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateScrollState() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [children])

  function scroll(amount: number) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" })
  }

  return (
    <div className={cn("relative group", className)}>
      {canScrollLeft && (
        <button
          onClick={() => scroll(-280)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover:lg:flex items-center justify-center size-8 rounded-full bg-background border shadow-card text-muted-foreground hover:text-foreground transition-all"
          aria-label="Scroll left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll(280)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover:lg:flex items-center justify-center size-8 rounded-full bg-background border shadow-card text-muted-foreground hover:text-foreground transition-all"
          aria-label="Scroll right"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2"
        onScroll={updateScrollState}
      >
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-[1]" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-[1]" />
        )}
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={cn("snap-start shrink-0", itemClassName)}>
                {child}
              </div>
            ))
          : <div className={cn("snap-start shrink-0", itemClassName)}>{children}</div>}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
