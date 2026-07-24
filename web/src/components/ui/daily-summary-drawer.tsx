"use client"

import { Drawer } from "@/components/ui/drawer"
import { DailySummaryContent } from "./daily-summary-content"

interface DailySummaryDrawerProps {
  employeeId: string
  selectedDate: string | null
  onClose: () => void
}

export function DailySummaryDrawer({ employeeId, selectedDate, onClose }: DailySummaryDrawerProps) {
  return (
    <Drawer
      open={!!selectedDate}
      onClose={onClose}
      title="Daily Activity"
      className="sm:max-w-xl"
    >
      <div className="h-full overflow-y-auto">
        <DailySummaryContent employeeId={employeeId} selectedDate={selectedDate} />
      </div>
    </Drawer>
  )
}
