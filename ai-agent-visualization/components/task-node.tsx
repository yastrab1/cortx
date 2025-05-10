import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { TaskExecution } from "@/lib/types"
import { STATUS_COLORS, STATUS_ICONS } from "@/lib/task-status.tsx"
import { TaskConnectionLines } from "./task-connection-lines"
import TaskResult from "./task-result"

interface TaskNodeProps {
  task: TaskExecution
  taskId: string
  depth: number
  isExpanded: boolean
  isActive: boolean
  onToggleExpand: (taskId: string) => void
}

export function TaskNode({
  task,
  taskId,
  depth,
  isExpanded,
  isActive,
  onToggleExpand,
}: TaskNodeProps) {
  const hasChildren = task.children.length > 0

  return (
    <div className="mb-2 relative">
      <TaskConnectionLines depth={depth} hasChildren={hasChildren} isExpanded={isExpanded} />

      <div
        className={`
          flex items-start rounded-md p-2 transition-colors
          ${isActive ? "bg-gray-800/60" : "hover:bg-gray-800/40"}
          ${task.status === "executing" ? "shadow-[0_0_15px_rgba(168,85,247,0.3)]" : ""}
          ${task.status === "planning" ? "shadow-[0_0_15px_rgba(96,165,250,0.3)]" : ""}
          ${task.status === "completed" ? "border border-gray-700" : ""}
        `}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {hasChildren && (
          <button onClick={() => onToggleExpand(taskId)} className="mr-1 mt-1 text-gray-400 hover:text-white">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}

        {!hasChildren && <div className="w-5 mr-1"></div>}

        <div className="flex-1">
          <div className="flex items-center">
            {STATUS_ICONS[task.status]}
            <span className={`ml-2 font-medium ${STATUS_COLORS[task.status]}`}>
              {task.name}
            </span>

            {task.status !== "pending" && task.startTime && (
              <span className="ml-2 text-xs text-gray-500">
                {new Date(task.startTime).toLocaleTimeString()}
              </span>
            )}

            {task.status === "completed" && task.endTime && task.startTime && (
              <span className="ml-1 text-xs text-gray-500">
                - {new Date(task.endTime).toLocaleTimeString()} (
                {Math.round((task.endTime - task.startTime) / 1000)}s)
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500 ml-6 mt-1">{task.goal}</div>

          {/* Planning steps */}
          {task.status !== "pending" && task.planningSteps.length > 0 && (
            <div className="ml-6 mt-2">
              <div className="text-xs font-medium text-blue-400 mb-1">Planning:</div>
              <div className="space-y-1 bg-blue-900/10 p-2 rounded border border-blue-900/20">
                <AnimatePresence>
                  {task.planningSteps.map((step, index) => (
                    <motion.div
                      key={`${taskId}-planning-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-gray-400"
                    >
                      {step}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Execution steps */}
          {task.status === "executing" && task.executionSteps.length > 0 && (
            <div className="ml-6 mt-2">
              <div className="text-xs font-medium text-purple-400 mb-1">Execution:</div>
              <div className="space-y-1 bg-purple-900/10 p-2 rounded border border-purple-900/20">
                <AnimatePresence>
                  {task.executionSteps.map((step, index) => (
                    <motion.div
                      key={`${taskId}-execution-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs"
                    >
                      <div className="text-purple-300">{step.name}</div>
                      <div className="text-gray-400 ml-2">{step.output}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Task result */}
          {task.status === "completed" && task.result && (
            <div className="ml-6 mt-2">
              <TaskResult result={task.result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 