import type { TaskExecution } from "@/lib/types"

export const getTaskColor = (task: TaskExecution): string => {
  if (!task?.id) return "from-gray-600 to-gray-400"

  const colorMap: Record<string, string> = {
    "1": "from-blue-600 to-blue-400",
    "2": "from-purple-600 to-purple-400",
    "3": "from-pink-600 to-pink-400",
    "4": "from-yellow-600 to-yellow-400",
    "5": "from-green-600 to-green-400",
  }

  const prefix = task.id.charAt(0)
  return colorMap[prefix] || "from-gray-600 to-gray-400"
}

export const getTaskWidth = (task: TaskExecution, duration: number): number => {
  if (!task?.startTime) return 0
  const endTime = task.endTime || Date.now()
  const taskDuration = endTime - task.startTime
  return (taskDuration / duration) * 100
}

export const getTaskLeft = (task: TaskExecution, minTime: number, duration: number): number => {
  if (!task?.startTime) return 0
  return ((task.startTime - minTime) / duration) * 100
}

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  return `${seconds}s`
}

export const groupTasksByParent = (tasks: TaskExecution[]): Record<string, TaskExecution[]> => {
  const groupedTasks: Record<string, TaskExecution[]> = {}

  tasks.forEach((task) => {
    if (!task?.id) return

    const parentId = task.id.includes(".") ? task.id.split(".")[0] : "root"
    if (!groupedTasks[parentId]) {
      groupedTasks[parentId] = []
    }
    groupedTasks[parentId].push(task)
  })

  return groupedTasks
}

export const getGroupName = (parentId: string, firstTask: TaskExecution | undefined): string => {
  if (parentId === "root") return "Main Planning"
  if (!firstTask?.name) return `${parentId}. Tasks`
  return `${parentId}. ${firstTask.name.split(" ")[0] || "Tasks"}`
} 