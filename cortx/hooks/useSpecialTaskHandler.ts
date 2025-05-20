import { useEffect } from 'react'
import type { TaskExecution } from '@/lib/types'

export const useSpecialTaskHandler = (
  isProcessing: boolean,
  state: {
    taskExecutions: Record<string, TaskExecution>
    activeTaskIds: string[]
  },
  simulateTaskPlanning: (taskId: string) => void,
  addLogEntry: (entry: string) => void
) => {
  useEffect(() => {
    if (!isProcessing) return

    // Check if task 1.1 is completed and 1.2 is pending
    const task1_1 = state.taskExecutions["1.1"]
    const task1_2 = state.taskExecutions["1.2"]

    if (
      task1_1 &&
      task1_1.status === "completed" &&
      task1_2 &&
      task1_2.status === "pending" &&
      !state.activeTaskIds.includes("1.2")
    ) {
      // Check if all dependencies for 1.2 are met
      const allDependenciesMet =
        task1_2.dependencies?.every((depId: string) => {
          const depTask = state.taskExecutions[depId]
          return depTask && depTask.status === "completed"
        }) || false

      if (allDependenciesMet) {
        addLogEntry("Detected that task 1.1 is completed and 1.2 is ready - starting 1.2")
        setTimeout(() => simulateTaskPlanning("1.2"), 500)
      }
    }
  }, [state.taskExecutions, state.activeTaskIds, isProcessing, simulateTaskPlanning, addLogEntry])
} 