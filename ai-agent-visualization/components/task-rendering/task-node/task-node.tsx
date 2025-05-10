import { ChevronRight, ChevronDown } from "lucide-react"
import type { TaskExecution } from "@/lib/types"
import { TaskConnectionLines } from "../../task-connection-lines"
import { TaskNodeHeader } from "./task-node-header"
import { TaskNodePlanning } from "./task-node-planning"
import { TaskNodeExecution } from "./task-node-execution"
import { TaskNodeResult } from "./task-node-result"

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
          <TaskNodeHeader
            status={task.status}
            name={task.name}
            startTime={task.startTime}
            endTime={task.endTime}
          />
          <div className="text-xs text-gray-500 ml-6 mt-1">{task.goal}</div>
          <TaskNodePlanning planningSteps={task.planningSteps} status={task.status} />
          <TaskNodeExecution executionSteps={task.executionSteps} status={task.status} />
          <TaskNodeResult status={task.status} result={task.result} />
        </div>
      </div>
    </div>
  )
} 