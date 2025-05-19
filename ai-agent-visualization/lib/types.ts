import { LanguageModel } from "ai";

export interface TaskExecution {
  id: string
  name: string
  goal: string
  status: TaskStatus
  startTime?: number
  endTime?: number
  planningSteps: string[]
  executionSteps: ExecutionStep[]
  children: string[]
  dependencies?: string[]
  result?: TaskResult
}

export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'executing'
  | 'waiting_for_children'
  | 'completed'
  | 'failed';

export type TaskEventType =
  | 'task_created'
  | 'task_status_change'
  | 'task_planning_subresults'
  | 'task_execution_subresults'
  | 'task_planning_results';

export interface ExecutionStep {
  name: string
  output: string
}

export interface TaskTreeProps {
  state: ExecutionState;
  setState: (state: (prev: ExecutionState) => ExecutionState) => void;
}

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

export interface TaskExecutionState {
  taskExecutions: Record<string, TaskExecution>
  activeTaskIds: string[]
  progress: number
  executionLog: string[]
  error: string | null
  taskDependencyMap: Record<string, string[]>
}

export type TaskID = string;

export interface TaskData {
  id: TaskID;
  status: TaskStatus;

  name: string;
  goal: string;
  dependencies: string[];
  agentDefinition: string;
  context: string[];
  upcomingTasks: string[];
  model: LanguageModel;

  planningSubresults: string[];
  executionSubresults: string[];
  planSubtasks: TaskID[];
  taskResult: TaskResult;

  taskCreationTime: number;
  taskStartTime: number;
  taskEndPlanningTime: number;
  taskEndExecutionTime: number;
  taskEndTime: number;

  depth: number;

  expanded: boolean;
}

export interface TaskGeneralEvent {
  eventType: TaskEventType;
  timestamp: string;
  taskId: TaskID;
  log: string;
}

export interface ExecutionState {
  tasks: Record<TaskID, TaskData>;
  taskCountByStatus: Record<TaskStatus, number>;
  errors: string[];
  executionLog: string[];
}

export interface TaskCreatedEvent extends TaskGeneralEvent {
  taskData: TaskData;
}

export interface TaskStatusChangeEvent extends TaskGeneralEvent {
  status: TaskStatus;
}

export interface TaskPlanningSubresults extends TaskGeneralEvent {
  subresults: string[];
}

export interface TaskExecutionSubresults extends TaskGeneralEvent {
  subresults: string[];
}

export interface TaskPlanningResults extends TaskGeneralEvent {
  result: TaskID[];
}

export type TaskEvent = TaskCreatedEvent | TaskStatusChangeEvent | TaskPlanningSubresults | TaskExecutionSubresults | TaskGeneralEvent | TaskPlanningResults;

export interface RawTask {
  name: string;
  goal: string;
  dependencies: string[];
  agentDefinition: string;
  context: string[];
  model: string;
}

export interface RawPlan {
  analysis: string;
  subtasks: RawTask[];
  benefitFromSplitting: boolean;
}