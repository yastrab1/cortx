"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import type { TaskExecution } from "@/lib/types"
import TaskResult from "./task-result"

interface TaskTreeProps {
  taskExecutions: Record<string, TaskExecution>
  activeTaskIds: string[]
}

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

  // Completely rewritten renderTaskNode function with comprehensive null checks
  const renderTaskNode = (taskId: string, depth = 0) => {
    // First, check if taskId exists in taskExecutions
    if (!taskId || !taskExecutions[taskId]) {
      console.warn(`Task with ID ${taskId} not found in taskExecutions`)
      return null
    }

    const task = taskExecutions[taskId]

    // Ensure all required properties exist with defaults
    const safeTask = {
      id: task?.id || "",
      name: task?.name || `Task ${taskId}`,
      goal: task?.goal || "",
      status: task?.status || "pending",
      startTime: task?.startTime,
      endTime: task?.endTime,
      planningSteps: task?.planningSteps || [],
      executionSteps: task?.executionSteps || [],
      children: task?.children || [],
      result: task?.result,
    }

    const isExpanded = expandedTasks[taskId] || false
    const hasChildren = safeTask.children.length > 0
    const isActive = activeTaskIds.includes(taskId)

    const statusColors = {
      pending: "text-gray-400",
      planning: "text-blue-400",
      executing: "text-purple-400",
      waiting_for_children: "text-yellow-400",
      completed: "text-green-400",
      failed: "text-red-400",
    }

    const statusIcons = {
      pending: null,
      planning: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
      executing: <Loader2 className="h-4 w-4 animate-spin text-purple-400" />,
      waiting_for_children: <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />,
      completed: <CheckCircle2 className="h-4 w-4 text-green-400" />,
      failed: <AlertCircle className="h-4 w-4 text-red-400" />,
    }

    // Add visual connection line for hierarchy
    const showConnectionLine = depth > 0

    return (
      <div key={taskId} className="mb-2 relative">
        {/* Connection line from parent to child */}
        {showConnectionLine && (
          <div
            className="absolute border-l-2 border-gray-700 h-full"
            style={{
              left: `${(depth - 1) * 20 + 10}px`,
              top: "-10px",
              bottom: hasChildren && isExpanded ? "10px" : "50%",
            }}
          />
        )}

        {/* Horizontal connection line */}
        {showConnectionLine && (
          <div
            className="absolute border-t-2 border-gray-700"
            style={{
              left: `${(depth - 1) * 20 + 10}px`,
              width: "10px",
              top: "16px",
            }}
          />
        )}

        <div
          className={`
          flex items-start rounded-md p-2 transition-colors
          ${isActive ? "bg-gray-800/60" : "hover:bg-gray-800/40"}
          ${safeTask.status === "executing" ? "shadow-[0_0_15px_rgba(168,85,247,0.3)]" : ""}
          ${safeTask.status === "planning" ? "shadow-[0_0_15px_rgba(96,165,250,0.3)]" : ""}
          ${safeTask.status === "completed" ? "border border-gray-700" : ""}
        `}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button onClick={() => toggleExpand(taskId)} className="mr-1 mt-1 text-gray-400 hover:text-white">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          {!hasChildren && <div className="w-5 mr-1"></div>}

          <div className="flex-1">
            <div className="flex items-center">
              {statusIcons[safeTask.status as keyof typeof statusIcons]}
              <span className={`ml-2 font-medium ${statusColors[safeTask.status as keyof typeof statusColors]}`}>
                {safeTask.name}
              </span>

              {safeTask.status !== "pending" && safeTask.startTime && (
                <span className="ml-2 text-xs text-gray-500">{new Date(safeTask.startTime).toLocaleTimeString()}</span>
              )}

              {safeTask.status === "completed" && safeTask.endTime && safeTask.startTime && (
                <span className="ml-1 text-xs text-gray-500">
                  - {new Date(safeTask.endTime).toLocaleTimeString()} (
                  {Math.round((safeTask.endTime - safeTask.startTime) / 1000)}s)
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 ml-6 mt-1">{safeTask.goal}</div>

            {/* Planning steps - simplified to show it's a single-step process */}
            {safeTask.status !== "pending" && safeTask.planningSteps.length > 0 && (
              <div className="ml-6 mt-2">
                <div className="text-xs font-medium text-blue-400 mb-1">Planning:</div>
                <div className="space-y-1 bg-blue-900/10 p-2 rounded border border-blue-900/20">
                  <AnimatePresence>
                    {safeTask.planningSteps.map((step, index) => (
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
            {safeTask.status === "executing" && safeTask.executionSteps.length > 0 && (
              <div className="ml-6 mt-2">
                <div className="text-xs font-medium text-purple-400 mb-1">Execution:</div>
                <div className="space-y-1 bg-purple-900/10 p-2 rounded border border-purple-900/20">
                  <AnimatePresence>
                    {safeTask.executionSteps.map((step, index) => (
                      <motion.div
                        key={`${taskId}-execution-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs"
                      >
                        <div className="text-purple-300">{step?.name || "Step"}</div>
                        <div className="text-gray-400 ml-2">{step?.output || ""}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Task result */}
            {safeTask.status === "completed" && safeTask.result && (
              <div className="ml-6 mt-2">
                <TaskResult result={safeTask.result} />
              </div>
            )}
          </div>
        </div>

        {/* Render children with extra safety checks */}
        {hasChildren && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {safeTask.children
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
