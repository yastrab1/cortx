import { useEffect } from 'react'
import type { Task } from '@/lib/types'

export const useTaskDependencies = (
  isProcessing: boolean,
  dummyTasks: Task[],
  setState: (updater: (prev: any) => any) => void,
  addLogEntry: (entry: string) => void
) => {
  useEffect(() => {
    if (!isProcessing) return

    // Build a reverse dependency map (which tasks depend on this task)
    const dependencyMap: Record<string, string[]> = {}

    // Initialize with empty arrays for all tasks
    dummyTasks.forEach((task) => {
      dependencyMap[task.id] = []
    })

    // Fill in the dependencies
    dummyTasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          if (dependencyMap[depId]) {
            dependencyMap[depId].push(task.id)
          }
        })
      }
    })

    setState(prev => ({ ...prev, taskDependencyMap: dependencyMap }))
    addLogEntry("Dependency map built successfully")
  }, [isProcessing, dummyTasks, setState, addLogEntry])
} 