import { useState, useRef, useCallback } from 'react'
import type { TaskExecution, Task, TaskResult, TaskExecutionState } from '@/lib/types'
import { dummyTasks } from '@/lib/dummy-data'

export const useTaskExecution = () => {
  const [state, setState] = useState<TaskExecutionState>({
    taskExecutions: {},
    activeTaskIds: [],
    progress: 0,
    executionLog: [],
    error: null,
    taskDependencyMap: {}
  })

  const planningIterationsRef = useRef<Record<string, number>>({})

  const addLogEntry = useCallback((entry: string) => {
    setState(prev => ({
      ...prev,
      executionLog: [...prev.executionLog, `[${new Date().toLocaleTimeString()}] ${entry}`]
    }))
    console.log(entry)
  }, [])

  const handleError = useCallback((context: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`${context}:`, error)
    setState(prev => ({
      ...prev,
      error: `${context}: ${errorMessage}`,
      executionLog: [...prev.executionLog, `ERROR: ${context} - ${errorMessage}`]
    }))
  }, [])

  const updateProgress = useCallback(() => {
    const totalTasks = dummyTasks.length
    const completedTasks = Object.values(state.taskExecutions).filter(
      task => task && task.status === "completed" && task.id !== "root"
    ).length

    const newProgress = Math.round((completedTasks / totalTasks) * 100)
    setState(prev => ({ ...prev, progress: newProgress }))

    if (newProgress === 100) {
      addLogEntry("All tasks completed successfully!")
    }
  }, [state.taskExecutions, addLogEntry])

  const getParentTaskId = useCallback((taskId: string) => {
    const parts = taskId.split(".")
    if (parts.length <= 1) return null
    return parts.slice(0, -1).join(".")
  }, [])

  const checkAndCompleteParentTask = useCallback((parentId: string) => {
    const parent = state.taskExecutions[parentId]
    if (!parent || !parent.children || parent.children.length === 0) return

    const allChildrenCompleted = parent.children.every(childId => {
      const childTask = state.taskExecutions[childId]
      return childTask && childTask.status === "completed"
    })

    if (allChildrenCompleted && parent.status === "waiting_for_children") {
      addLogEntry(`All subtasks for ${parentId} completed, finalizing parent task`)

      const childResults = parent.children
        .filter(childId => state.taskExecutions[childId])
        .map(childId => ({
          id: childId,
          name: state.taskExecutions[childId]?.name || `Task ${childId}`,
          result: state.taskExecutions[childId]?.result
        }))

      setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [parentId]: {
            ...prev.taskExecutions[parentId],
            status: "completed",
            endTime: Date.now(),
            result: {
              type: "aggregated_results",
              content: `Aggregated results from ${childResults.length} subtasks`,
              childResults
            }
          }
        },
        activeTaskIds: prev.activeTaskIds.filter(id => id !== parentId)
      }))

      const grandparentId = getParentTaskId(parentId)
      if (grandparentId) {
        checkAndCompleteParentTask(grandparentId)
      }
    }
  }, [state.taskExecutions, addLogEntry, getParentTaskId])

  const checkDependentTasks = useCallback((completedTaskId: string) => {
    const dependentTaskIds = state.taskDependencyMap[completedTaskId] || []

    if (dependentTaskIds.length > 0) {
      addLogEntry(`Checking ${dependentTaskIds.length} tasks that depend on ${completedTaskId}`)

      dependentTaskIds.forEach(taskId => {
        const task = state.taskExecutions[taskId]
        if (!task || task.status !== "pending") return

        const allDependenciesMet = task.dependencies?.every(depId => {
          const depTask = state.taskExecutions[depId]
          return depTask && depTask.status === "completed"
        }) || false

        if (allDependenciesMet) {
          addLogEntry(`All dependencies for task ${taskId} are now met, starting task`)
          setTimeout(() => simulateTaskPlanning(taskId), 500)
        }
      })
    }
  }, [state.taskExecutions, state.taskDependencyMap, addLogEntry])

  // ... Additional task execution methods will be added here

  return {
    state,
    setState,
    addLogEntry,
    handleError,
    updateProgress,
    getParentTaskId,
    checkAndCompleteParentTask,
    checkDependentTasks,
    planningIterationsRef
  }
} 