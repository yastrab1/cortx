"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import type { TaskExecution } from "@/lib/types"

interface ExecutionTimelineProps {
  taskExecutions: Record<string, TaskExecution>
}

export default function ExecutionTimeline({ taskExecutions }: ExecutionTimelineProps) {
  // Defensive check at the component level
  if (!taskExecutions || typeof taskExecutions !== "object") {
    return (
      <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
        <h3 className="font-bold mb-2">Error</h3>
        <p>Invalid task execution data</p>
      </div>
    )
  }

  const timelineData = useMemo(() => {
    try {
      // Filter out tasks that don't have required properties
      const tasks = Object.values(taskExecutions).filter(
        (task) => task && task.id && task.startTime && task.id !== "root",
      )

      if (tasks.length === 0) return { tasks: [], minTime: 0, maxTime: 0, duration: 0 }

      // Sort by start time
      tasks.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

      const minTime = tasks[0].startTime || 0
      const maxTime = Math.max(...tasks.map((t) => t.endTime || Date.now()))

      const duration = maxTime - minTime

      return { tasks, minTime, maxTime, duration }
    } catch (error) {
      console.error("Error processing timeline data:", error)
      return { tasks: [], minTime: 0, maxTime: 0, duration: 0 }
    }
  }, [JSON.stringify(taskExecutions)])

  const hasTasks = timelineData.tasks.length > 0

  if (!hasTasks) {
    return <div className="text-center text-gray-500 py-8">Timeline will appear when tasks start executing</div>
  }

  const getTaskColor = (task: TaskExecution) => {
    if (!task || !task.id) return "from-gray-600 to-gray-400"

    // Color based on task ID prefix to group related tasks
    if (task.id.startsWith("1")) return "from-blue-600 to-blue-400"
    if (task.id.startsWith("2")) return "from-purple-600 to-purple-400"
    if (task.id.startsWith("3")) return "from-pink-600 to-pink-400"
    if (task.id.startsWith("4")) return "from-yellow-600 to-yellow-400"
    if (task.id.startsWith("5")) return "from-green-600 to-green-400"
    return "from-gray-600 to-gray-400"
  }

  const getTaskWidth = (task: TaskExecution) => {
    if (!task || !task.startTime) return 0
    const endTime = task.endTime || Date.now()
    const taskDuration = endTime - task.startTime
    return (taskDuration / timelineData.duration) * 100
  }

  const getTaskLeft = (task: TaskExecution) => {
    if (!task || !task.startTime) return 0
    return ((task.startTime - timelineData.minTime) / timelineData.duration) * 100
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  // Group tasks by their parent task for better visualization
  const groupedTasks: Record<string, TaskExecution[]> = {}

  try {
    timelineData.tasks.forEach((task) => {
      if (!task || !task.id) return

      // Safely extract the parent ID
      let parentId = "root"
      try {
        parentId = task.id.includes(".") ? task.id.split(".")[0] : "root"
      } catch (e) {
        console.warn("Error extracting parent ID:", e)
      }

      if (!groupedTasks[parentId]) {
        groupedTasks[parentId] = []
      }
      groupedTasks[parentId].push(task)
    })
  } catch (error) {
    console.error("Error grouping tasks:", error)
  }

  // Get all parent IDs and sort them
  const parentIds = Object.keys(groupedTasks).sort()

  // Wrap the rendering in a try-catch block
  try {
    return (
      <div>
        <div className="mb-4 flex justify-between text-xs text-gray-500">
          <div>{formatTime(timelineData.minTime)}</div>
          <div>Timeline Duration: {formatDuration(timelineData.duration)}</div>
          <div>{formatTime(timelineData.maxTime)}</div>
        </div>

        {/* Time markers */}
        <div className="relative h-6 mb-2">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute top-0 h-full border-l border-gray-700 flex items-center"
              style={{ left: `${percent}%` }}
            >
              <span className="text-xs text-gray-500 ml-1">
                {formatTime(timelineData.minTime + (timelineData.duration * percent) / 100)}
              </span>
            </div>
          ))}
        </div>

        {/* Group labels */}
        <div className="space-y-6 mt-8">
          {parentIds.map((parentId) => {
            // Get the first task in the group to extract the name
            const firstTask = groupedTasks[parentId]?.[0]
            const groupName =
              parentId === "root"
                ? "Main Planning"
                : firstTask && firstTask.name
                  ? `${parentId}. ${firstTask.name.split(" ")[0] || "Tasks"}`
                  : `${parentId}. Tasks`

            return (
              <div key={parentId} className="space-y-3">
                <div className="text-sm font-medium text-gray-300 mb-2">{groupName}</div>

                {groupedTasks[parentId]?.map((task) => {
                  if (!task || !task.id) return null

                  return (
                    <div key={task.id} className="relative h-8 group">
                      <div className="absolute left-0 top-0 h-full w-full bg-gray-800/30 rounded"></div>

                      {/* Task execution bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${getTaskWidth(task)}%`,
                          x: `${getTaskLeft(task)}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`absolute top-0 h-full rounded bg-gradient-to-r ${getTaskColor(task)} shadow-lg`}
                        style={{
                          left: 0,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
                          {task.name || `Task ${task.id}`}
                        </div>
                      </motion.div>

                      {/* Planning phase indicator */}
                      {task.planningSteps && task.planningSteps.length > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${task.planningSteps.length > 0 ? 5 : 0}%`,
                            x: `${getTaskLeft(task)}%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute top-0 h-full rounded-l bg-blue-500/50 border-r border-white/20"
                          style={{
                            left: 0,
                          }}
                        />
                      )}

                      {/* Task details tooltip on hover */}
                      <div className="absolute left-1/2 bottom-full mb-2 bg-gray-800 rounded p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none transform -translate-x-1/2 w-64">
                        <div className="font-medium">{task.name || `Task ${task.id}`}</div>
                        <div className="text-gray-400 mt-1">{task.goal || "No goal specified"}</div>
                        {task.startTime && task.endTime && (
                          <div className="mt-1 text-gray-400">
                            Duration: {formatDuration(task.endTime - task.startTime)}
                          </div>
                        )}
                        {task.result && (
                          <div className="mt-1 text-gray-400 truncate">
                            Result:{" "}
                            {typeof task.result.content === "string"
                              ? task.result.content.length > 40
                                ? task.result.content.substring(0, 40) + "..."
                                : task.result.content
                              : "Complex result"}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering execution timeline:", error)
    return (
      <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
        <h3 className="font-bold mb-2">Error rendering timeline</h3>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }
}
