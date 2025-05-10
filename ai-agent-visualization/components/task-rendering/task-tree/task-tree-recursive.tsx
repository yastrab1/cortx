import { motion, AnimatePresence } from "framer-motion"
import { TaskNode } from "../task-node/task-node"
import type { TaskExecution } from "@/lib/types"

interface TaskTreeRecursiveProps {
  taskExecutions: Record<string, TaskExecution>
  activeTaskIds: string[]
  expandedTasks: Record<string, boolean>
  toggleExpand: (taskId: string) => void
  taskId: string
  depth?: number
}

export function TaskTreeRecursive({
  taskExecutions,
  activeTaskIds,
  expandedTasks,
  toggleExpand,
  taskId,
  depth = 0,
}: TaskTreeRecursiveProps) {
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
              .map((childId) => (
                <TaskTreeRecursive
                  key={childId}
                  taskExecutions={taskExecutions}
                  activeTaskIds={activeTaskIds}
                  expandedTasks={expandedTasks}
                  toggleExpand={toggleExpand}
                  taskId={childId}
                  depth={depth + 1}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
} 