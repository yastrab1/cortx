"use client"

import { useState } from "react"
import type { TaskTreeProps } from "@/lib/types"
import { TaskTreeError } from "./task-tree-error"
import { TaskTreeLoading } from "./task-tree-loading"
import { TaskTreeRecursive } from "./task-tree-recursive"
import { TaskID } from "@/lib/types"

export default function TaskTree({ state, setState }: TaskTreeProps) {
  if (!state.tasks || typeof state.tasks !== "object") {
    return <TaskTreeError message="Invalid task execution data" />
  }

  const toggleExpand = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          expanded: !prev.tasks[taskId].expanded
        }
      }
    }));
  }

  try {
    if (!state.tasks["root"]) {
      return <TaskTreeLoading />
    }
    return (
      <TaskTreeRecursive
        toggleExpand={toggleExpand}
        taskId="root"
        state={state}
      />
    )
  } catch (error) {
    console.error("Error rendering task tree:", error)
    return <TaskTreeError message={error instanceof Error ? error.message : "Unknown error"} />
  }
}
