import type { Task, TaskExecution, TaskResult } from '@/lib/types'
import { generateTaskResult } from '@/utils/taskResultGenerator'

export class TaskSimulationService {
  private addLogEntry: (entry: string) => void
  private handleError: (context: string, error: unknown) => void
  private setState: (updater: (prev: any) => any) => void
  private getParentTaskId: (taskId: string) => string | null
  private checkAndCompleteParentTask: (parentId: string) => void
  private checkDependentTasks: (taskId: string) => void
  private updateProgress: () => void
  private planningIterationsRef: { current: Record<string, number> }

  constructor(
    addLogEntry: (entry: string) => void,
    handleError: (context: string, error: unknown) => void,
    setState: (updater: (prev: any) => any) => void,
    getParentTaskId: (taskId: string) => string | null,
    checkAndCompleteParentTask: (parentId: string) => void,
    checkDependentTasks: (taskId: string) => void,
    updateProgress: () => void,
    planningIterationsRef: { current: Record<string, number> }
  ) {
    this.addLogEntry = addLogEntry
    this.handleError = handleError
    this.setState = setState
    this.getParentTaskId = getParentTaskId
    this.checkAndCompleteParentTask = checkAndCompleteParentTask
    this.checkDependentTasks = checkDependentTasks
    this.updateProgress = updateProgress
    this.planningIterationsRef = planningIterationsRef
  }

  simulateMainPlanning(prompt: string): void {
    try {
      const mainTaskId = "root"
      this.setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [mainTaskId]: {
            id: mainTaskId,
            status: "planning",
            name: "Main Planning Agent",
            goal: "Plan execution for: " + prompt,
            startTime: Date.now(),
            planningSteps: [],
            children: [],
            result: undefined,
            executionSteps: [],
          },
        },
        activeTaskIds: ["root"]
      }))

      const planningSteps = [
        "Analyzing request...",
        "Identifying main components...",
        "Determining task hierarchy...",
        "Assessing dependencies...",
        "Finalizing execution plan...",
      ]

      let stepIndex = 0
      const planningInterval = setInterval(() => {
        try {
          if (stepIndex < planningSteps.length) {
            this.addLogEntry(`Main planning: ${planningSteps[stepIndex]}`)
            this.setState(prev => ({
              ...prev,
              taskExecutions: {
                ...prev.taskExecutions,
                [mainTaskId]: {
                  ...prev.taskExecutions[mainTaskId],
                  planningSteps: [...(prev.taskExecutions[mainTaskId]?.planningSteps || []), planningSteps[stepIndex]],
                },
              },
            }))
            stepIndex++
          } else {
            clearInterval(planningInterval)
            this.addLogEntry("Main planning complete, creating top-level tasks")
            this.simulateCreateTopLevelTasks(mainTaskId, )
          }
        } catch (err) {
          clearInterval(planningInterval)
          this.handleError("Error in planning phase", err)
        }
      }, 800)
    } catch (err) {
      this.handleError("Error initializing planning", err)
    }
  }

  simulateCreateTopLevelTasks(parentId: string, dummyTasks: Task[]): void {
    try {
      const topLevelTasks = dummyTasks.filter((task) => !task.id.includes("."))
      const childIds = topLevelTasks.map((task) => task.id)

      this.setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [parentId]: {
            ...prev.taskExecutions[parentId],
            status: "completed",
            children: childIds,
            endTime: Date.now(),
            result: {
              type: "plan",
              content: `Created ${childIds.length} top-level tasks`,
            },
          },
        },
      }))

      topLevelTasks.forEach((task) => {
        this.setState(prev => ({
          ...prev,
          taskExecutions: {
            ...prev.taskExecutions,
            [task.id]: {
              id: task.id,
              status: "pending",
              name: task.name,
              goal: task.goal,
              dependencies: task.dependencies || [],
              children: [],
              planningSteps: [],
              executionSteps: [],
              result: undefined,
            },
          },
        }))
      })

      const tasksWithNoDeps = topLevelTasks.filter((task) => !task.dependencies || task.dependencies.length === 0)
      tasksWithNoDeps.forEach((task) => {
        setTimeout(() => this.simulateTaskPlanning(task.id), 1000)
      })
    } catch (err) {
      this.handleError("Error creating top-level tasks", err)
    }
  }

  simulateTaskPlanning(taskId: string): void {
    try {
      if (!this.planningIterationsRef.current[taskId]) {
        this.planningIterationsRef.current[taskId] = 0
      }
      this.planningIterationsRef.current[taskId]++

      const iterations = this.planningIterationsRef.current[taskId]
      if (iterations > 3) {
        this.addLogEntry(
          `Detected potential infinite loop in planning for task ${taskId} (${iterations} iterations). Proceeding to execution.`,
        )
        this.simulateTaskExecution(taskId)
        return
      }

      this.addLogEntry(`Starting planning for task: ${taskId} (iteration ${iterations})`)

      this.setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [taskId]: {
            ...prev.taskExecutions[taskId],
            status: "planning",
            startTime: Date.now(),
          },
        },
        activeTaskIds: [...prev.activeTaskIds, taskId],
      }))

      const planningSteps = [
        "Analyzing task requirements...",
        "Identifying subtasks...",
        "Determining execution approach...",
        "Finalizing task plan...",
      ]

      let stepIndex = 0
      const planningInterval = setInterval(() => {
        try {
          if (stepIndex < planningSteps.length) {
            this.setState(prev => ({
              ...prev,
              taskExecutions: {
                ...prev.taskExecutions,
                [taskId]: {
                  ...prev.taskExecutions[taskId],
                  planningSteps: [...(prev.taskExecutions[taskId]?.planningSteps || []), planningSteps[stepIndex]],
                },
              },
            }))
            stepIndex++
          } else {
            clearInterval(planningInterval)

            if (taskId === "1.2") {
              this.addLogEntry(`Task ${taskId} planning complete, proceeding directly to execution`)
              this.simulateTaskExecution(taskId)
              return
            }

            const subtasks = dummyTasks.filter(
              (task) => task.id.startsWith(taskId + ".") && task.id.split(".").length === taskId.split(".").length + 1,
            )

            if (subtasks.length > 0) {
              this.addLogEntry(`Task ${taskId} planning complete, creating ${subtasks.length} subtasks`)
              this.simulateCreateSubtasks(taskId, subtasks)
            } else {
              this.addLogEntry(`Task ${taskId} planning complete, executing task`)
              this.simulateTaskExecution(taskId)
            }
          }
        } catch (err) {
          clearInterval(planningInterval)
          this.handleError(`Error in planning phase for task ${taskId}`, err)
        }
      }, 600)
    } catch (err) {
      this.handleError(`Error initializing planning for task ${taskId}`, err)
    }
  }

  simulateCreateSubtasks(parentId: string, subtasks: Task[]): void {
    try {
      const childIds = subtasks.map((task) => task.id)

      this.setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [parentId]: {
            ...prev.taskExecutions[parentId],
            status: "waiting_for_children",
            children: childIds,
            result: {
              type: "plan",
              content: `Created ${childIds.length} subtasks`,
            },
          },
        },
      }))

      subtasks.forEach((task) => {
        this.setState(prev => ({
          ...prev,
          taskExecutions: {
            ...prev.taskExecutions,
            [task.id]: {
              id: task.id,
              status: "pending",
              name: task.name,
              goal: task.goal,
              dependencies: task.dependencies || [],
              children: [],
              planningSteps: [],
              executionSteps: [],
              result: undefined,
            },
          },
        }))
      })

      const readySubtasks = subtasks.filter(
        (task) =>
          !task.dependencies ||
          task.dependencies.length === 0 ||
          task.dependencies.every((depId: string) => {
            const depTask = this.state.taskExecutions[depId]
            return (depTask && depTask.status === "completed") || depId === parentId
          }),
      )

      readySubtasks.forEach((task, index) => {
        setTimeout(
          () => {
            this.addLogEntry(`Starting task ${task.id} as dependencies are now met`)
            this.simulateTaskPlanning(task.id)
          },
          500 + index * 300,
        )
      })
    } catch (err) {
      this.handleError(`Error creating subtasks for ${parentId}`, err)
    }
  }

  simulateTaskExecution(taskId: string): void {
    try {
      this.setState(prev => ({
        ...prev,
        taskExecutions: {
          ...prev.taskExecutions,
          [taskId]: {
            ...prev.taskExecutions[taskId],
            status: "executing",
          },
        },
      }))

      const executionSteps = [
        { name: "Initialize execution context", output: "Context initialized with relevant parameters" },
        {
          name: "Retrieve necessary information",
          output: "Retrieved information from previous tasks and external sources",
        },
        { name: "Process data", output: "Data processed according to task requirements" },
        { name: "Generate results", output: "Final results generated successfully" },
      ]

      let stepIndex = 0
      const executionInterval = setInterval(() => {
        try {
          if (stepIndex < executionSteps.length) {
            this.addLogEntry(`Task ${taskId} executing step: ${executionSteps[stepIndex].name}`)
            this.setState(prev => ({
              ...prev,
              taskExecutions: {
                ...prev.taskExecutions,
                [taskId]: {
                  ...prev.taskExecutions[taskId],
                  executionSteps: [...(prev.taskExecutions[taskId]?.executionSteps || []), executionSteps[stepIndex]],
                },
              },
            }))
            stepIndex++
          } else {
            clearInterval(executionInterval)

            const result = generateTaskResult(taskId)

            this.setState(prev => ({
              ...prev,
              taskExecutions: {
                ...prev.taskExecutions,
                [taskId]: {
                  ...prev.taskExecutions[taskId],
                  status: "completed",
                  endTime: Date.now(),
                  result,
                },
              },
              activeTaskIds: prev.activeTaskIds.filter(id => id !== taskId),
            }))

            this.addLogEntry(`Task ${taskId} completed with result type: ${result.type}`)

            const parentId = this.getParentTaskId(taskId)
            if (parentId) {
              this.checkAndCompleteParentTask(parentId)
            }

            this.checkDependentTasks(taskId)
            this.updateProgress()
          }
        } catch (err) {
          clearInterval(executionInterval)
          this.handleError(`Error in execution phase for task ${taskId}`, err)
        }
      }, 1000)
    } catch (err) {
      this.handleError(`Error initializing execution for task ${taskId}`, err)
    }
  }
} 