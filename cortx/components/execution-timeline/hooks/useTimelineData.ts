import { useMemo } from "react"
import type { TaskExecution } from "@/lib/types"
import { groupTasksByParent } from "../utils/timelineUtils"

interface TimelineData {
  tasks: TaskExecution[]
  minTime: number
  maxTime: number
  duration: number
  groupedTasks: Record<string, TaskExecution[]>
  parentIds: string[]
}

export const useTimelineData = (taskExecutions: Record<string, TaskExecution>): TimelineData => {
  return useMemo(() => {
    try {
      // Filter out tasks that don't have required properties
      const tasks = Object.values(taskExecutions).filter(
        (task) => task && task.id && task.startTime && task.id !== "root",
      )

      if (tasks.length === 0) {
        return {
          tasks: [],
          minTime: 0,
          maxTime: 0,
          duration: 0,
          groupedTasks: {},
          parentIds: [],
        }
      }

      // Sort by start time
      tasks.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

      const minTime = tasks[0].startTime || 0
      const maxTime = Math.max(...tasks.map((t) => t.endTime || Date.now()))
      const duration = maxTime - minTime

      // Group tasks by parent
      const groupedTasks = groupTasksByParent(tasks)
      const parentIds = Object.keys(groupedTasks).sort()

      return {
        tasks,
        minTime,
        maxTime,
        duration,
        groupedTasks,
        parentIds,
      }
    } catch (error) {
      console.error("Error processing timeline data:", error)
      return {
        tasks: [],
        minTime: 0,
        maxTime: 0,
        duration: 0,
        groupedTasks: {},
        parentIds: [],
      }
    }
  }, [JSON.stringify(taskExecutions)])
} 