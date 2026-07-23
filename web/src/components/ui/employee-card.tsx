"use client"

import { Eye, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { staggerItem } from "@/components/animations"
import type { UserDTO } from "@/lib/api-hooks"

interface EmployeeCardProps {
  employee: UserDTO
  projectCount: number
  onView: (id: string) => void
  onEdit: (employee: UserDTO) => void
  onDelete: (employee: UserDTO) => void
}

export function EmployeeCard({ employee, projectCount, onView, onEdit, onDelete }: EmployeeCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover="lift" className="h-full flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={employee.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold truncate">{employee.name}</p>
              <p className="text-caption font-mono text-muted-foreground truncate">{employee.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{employee.position ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-medium">{projectCount}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-muted-foreground">Status</span>
              {employee.githubUsername ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="default">Inactive</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onView(employee.id)}>
              <Eye size={12} /> View
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(employee)}>
              <Pencil size={12} /> Edit
            </Button>
            <Button variant="destructive" size="sm" className="flex-none" onClick={() => onDelete(employee)}>
              <Trash2 size={12} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
