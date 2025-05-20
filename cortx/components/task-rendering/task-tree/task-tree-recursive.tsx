import { motion, AnimatePresence } from "framer-motion"
import { TaskNode } from "../task-node/task-node"
import type { TaskExecution, ExecutionState } from "@/lib/types"

interface TaskTreeRecursiveProps {
  toggleExpand: (taskId: string) => void
  taskId: string
  state: ExecutionState
  depth?: number
}

export function TaskTreeRecursive({
  toggleExpand,
  taskId,
  state,
  depth = 0,
}: TaskTreeRecursiveProps) {
  if (!taskId || !state.tasks[taskId]) {
    console.warn(`Task with ID ${taskId} not found in taskExecutions`);
    return null;
  }

  const task = state.tasks[taskId];
  const isExpanded = task.expanded;

  return (
    <div key={taskId}>
      <TaskNode
        taskId={taskId}
        state={state}
        depth={depth}
        onToggleExpand={toggleExpand}
      />
      {task.planSubtasks.length > 0 && isExpanded && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {task.planSubtasks
              .filter((childId) => !!childId && !!state.tasks[childId])
              .map((childId) => (
                <TaskTreeRecursive
                  key={childId}
                  toggleExpand={toggleExpand}
                  taskId={childId}
                  state={state}
                  depth={depth + 1}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
} 