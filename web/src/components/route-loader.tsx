"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

function RouteLoaderInner() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setLoading(true)
      const timer = setTimeout(() => setLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-accent"
          initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
          animate={{ scaleX: 1, transformOrigin: "0% 50%" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  )
}

export function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <RouteLoaderInner />
    </Suspense>
  )
}
