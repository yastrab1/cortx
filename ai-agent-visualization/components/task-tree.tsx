"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { TaskTreeProps } from "@/lib/types"
import { TaskNode } from "./task-node"

export default function TaskTree({ taskExecutions, activeTaskIds }: TaskTreeProps) {
  // Defensive check at the component level
  if (!taskExecutions || typeof taskExecutions !== "object") {
    return (
      <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
        <h3 className="font-bold mb-2">Error</h3>
        <p>Invalid task execution data</p>
      </div>
    )
  }

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    root: true,
  })

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  const renderTaskNode = (taskId: string, depth = 0) => {
    // First, check if taskId exists in taskExecutions
    if (!taskId || !taskExecutions[taskId]) {
      console.warn(`Task with ID ${taskId} not found in taskExecutions`)
      return null
    }

    const task = taskExecutions[taskId]
    const isExpanded = expandedTasks[taskId] || false
    const isActive = activeTaskIds.includes(taskId)

    return (
      <div key={taskId}>
        <TaskNode
          task={task}
          taskId={taskId}
          depth={depth}
          isExpanded={isExpanded}
          isActive={isActive}
          onToggleExpand={toggleExpand}
        />

        {/* Render children */}
        {task.children.length > 0 && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {task.children
                .filter((childId) => !!childId && !!taskExecutions[childId])
                .map((childId) => renderTaskNode(childId, depth + 1))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    )
  }

  // Add a try-catch block around the rendering to provide more information about errors
  try {
    // Check if "root" exists in taskExecutions before rendering
    if (!taskExecutions["root"]) {
      return <div className="text-center text-gray-500 py-8">Waiting for tasks to be created...</div>
    }

    return <div>{renderTaskNode("root")}</div>
  } catch (error) {
    console.error("Error rendering task tree:", error)
    return (
      <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
        <h3 className="font-bold mb-2">Error rendering task tree</h3>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }
}
