export type TaskStatus = "pending" | "planning" | "executing" | "waiting_for_children" | "completed" | "failed"

export interface Task {
  id: string
  name: string
  goal: string
  dependencies: string[]
  agentDefinition?: string
  context?: string[]
  upcomingTasks?: string[]
  model?: string
}

export interface ExecutionStep {
  name: string
  output: string
}

export interface TaskResult {
  type: string
  content: string | string[] | any
  childResults?: Array<{
    id: string
    name: string
    result: TaskResult | null
  }>
  visualPreviews?: string[]
  metrics?: Record<string, number>
  details?: Record<string, string | number>
}

export interface TaskExecution {
  id: string
  status: TaskStatus
  name: string
  goal: string
  dependencies?: string[]
  startTime?: number
  endTime?: number
  planningSteps: string[]
  executionSteps: ExecutionStep[]
  children: string[]
  result: TaskResult | null
}
