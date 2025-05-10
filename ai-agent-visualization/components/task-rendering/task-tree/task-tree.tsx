"use client"

import { useState } from "react"
import type { TaskTreeProps } from "@/lib/types"
import { TaskTreeError } from "./task-tree-error"
import { TaskTreeLoading } from "./task-tree-loading"
import { TaskTreeRecursive } from "./task-tree-recursive"

export default function TaskTree({ taskExecutions, activeTaskIds }: TaskTreeProps) {
  if (!taskExecutions || typeof taskExecutions !== "object") {
    return <TaskTreeError message="Invalid task execution data" />
  }

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({ root: true })

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  try {
    if (!taskExecutions["root"]) {
      return <TaskTreeLoading />
    }
    return (
      <TaskTreeRecursive
        taskExecutions={taskExecutions}
        activeTaskIds={activeTaskIds}
        expandedTasks={expandedTasks}
        toggleExpand={toggleExpand}
        taskId="root"
      />
    )
  } catch (error) {
    console.error("Error rendering task tree:", error)
    return <TaskTreeError message={error instanceof Error ? error.message : "Unknown error"} />
  }
}
