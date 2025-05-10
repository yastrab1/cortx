"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Play } from "lucide-react"
import { dummyTasks, initialPrompt } from "@/lib/dummy-data"
import type { Task, TaskExecution } from "@/lib/types"
import TaskTree from "./task-rendering/task-tree/task-tree"
import ExecutionTimeline from "./execution-timeline"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AgentInterface() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [taskExecutions, setTaskExecutions] = useState<Record<string, TaskExecution>>({})
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [taskDependencyMap, setTaskDependencyMap] = useState<Record<string, string[]>>({})

  // Ref to track planning iterations to prevent infinite loops
  const planningIterationsRef = useRef<Record<string, number>>({})

  // Effect to build the dependency map when tasks change
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

    setTaskDependencyMap(dependencyMap)
    console.log("Dependency map built:", dependencyMap)
  }, [isProcessing])

  const startProcess = () => {
    try {
      setIsProcessing(true)
      setTaskExecutions({})
      setActiveTaskIds([])
      setProgress(0)
      setExecutionLog([])
      setError(null)
      planningIterationsRef.current = {} // Reset planning iterations counter

      // Start with the main planning task
      addLogEntry("Starting execution of prompt: " + prompt)
      simulateMainPlanning()
    } catch (err) {
      handleError("Error starting process", err)
    }
  }

  const handleError = (context: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`${context}:`, error)
    setError(`${context}: ${errorMessage}`)
    addLogEntry(`ERROR: ${context} - ${errorMessage}`)
    setIsProcessing(false)
  }

  const addLogEntry = (entry: string) => {
    setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${entry}`])
    console.log(entry) // Also log to console for debugging
  }

  const simulateMainPlanning = () => {
    try {
      // Create the main planning task
      const mainTaskId = "root"
      setTaskExecutions((prev) => ({
        ...prev,
        [mainTaskId]: {
          id: mainTaskId,
          status: "planning",
          name: "Main Planning Agent",
          goal: "Plan execution for: " + prompt,
          startTime: Date.now(),
          planningSteps: [],
          children: [],
          result: null,
          executionSteps: [],
        },
      }))
      setActiveTaskIds(["root"])

      // Simulate planning steps
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
            addLogEntry(`Main planning: ${planningSteps[stepIndex]}`)
            setTaskExecutions((prev) => ({
              ...prev,
              [mainTaskId]: {
                ...prev[mainTaskId],
                planningSteps: [...(prev[mainTaskId]?.planningSteps || []), planningSteps[stepIndex]],
              },
            }))
            stepIndex++
          } else {
            clearInterval(planningInterval)
            // Planning complete, create top-level tasks
            addLogEntry("Main planning complete, creating top-level tasks")
            simulateCreateTopLevelTasks(mainTaskId)
          }
        } catch (err) {
          clearInterval(planningInterval)
          handleError("Error in planning phase", err)
        }
      }, 800)
    } catch (err) {
      handleError("Error initializing planning", err)
    }
  }

  const simulateCreateTopLevelTasks = (parentId: string) => {
    try {
      // Get top-level tasks (those with single-digit IDs)
      const topLevelTasks = dummyTasks.filter((task) => !task.id.includes("."))
      const childIds = topLevelTasks.map((task) => task.id)

      // Update parent to include children
      setTaskExecutions((prev) => {
        const parentTask = prev[parentId]
        if (!parentTask) return prev // Safety check

        return {
          ...prev,
          [parentId]: {
            ...parentTask,
            status: "completed",
            children: childIds,
            endTime: Date.now(),
            result: {
              type: "plan",
              content: `Created ${childIds.length} top-level tasks`,
            },
          },
        }
      })

      // Create task executions for top-level tasks
      topLevelTasks.forEach((task) => {
        setTaskExecutions((prev) => ({
          ...prev,
          [task.id]: {
            id: task.id,
            status: "pending",
            name: task.name,
            goal: task.goal,
            dependencies: task.dependencies || [],
            children: [],
            planningSteps: [],
            executionSteps: [],
            result: null,
          },
        }))
      })

      // Start executing tasks that have no dependencies
      const tasksWithNoDeps = topLevelTasks.filter((task) => !task.dependencies || task.dependencies.length === 0)
      tasksWithNoDeps.forEach((task) => {
        setTimeout(() => simulateTaskPlanning(task.id), 1000)
      })
    } catch (err) {
      handleError("Error creating top-level tasks", err)
    }
  }

  const simulateTaskPlanning = (taskId: string) => {
    try {
      // Initialize or increment the planning iterations counter for this task
      if (!planningIterationsRef.current[taskId]) {
        planningIterationsRef.current[taskId] = 0
      }
      planningIterationsRef.current[taskId]++

      // Check for infinite loop - if a task has been planned more than 3 times, skip to execution
      const iterations = planningIterationsRef.current[taskId]
      if (iterations > 3) {
        addLogEntry(
          `Detected potential infinite loop in planning for task ${taskId} (${iterations} iterations). Proceeding to execution.`,
        )
        simulateTaskExecution(taskId)
        return
      }

      addLogEntry(`Starting planning for task: ${taskId} (iteration ${iterations})`)

      // Update task status to planning
      setTaskExecutions((prev) => {
        const task = prev[taskId]
        if (!task) return prev // Safety check

        return {
          ...prev,
          [taskId]: {
            ...task,
            status: "planning",
            startTime: Date.now(),
          },
        }
      })

      setActiveTaskIds((prev) => [...prev, taskId])

      // Simulate planning steps
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
            setTaskExecutions((prev) => {
              const task = prev[taskId]
              if (!task) return prev // Safety check

              return {
                ...prev,
                [taskId]: {
                  ...task,
                  planningSteps: [...(task.planningSteps || []), planningSteps[stepIndex]],
                },
              }
            })
            stepIndex++
          } else {
            clearInterval(planningInterval)

            // Special case for task 1.2 (Search Query Formulation) - skip subtask creation and go straight to execution
            if (taskId === "1.2") {
              addLogEntry(`Task ${taskId} planning complete, proceeding directly to execution`)
              simulateTaskExecution(taskId)
              return
            }

            // Check if this task has subtasks
            const subtasks = dummyTasks.filter(
              (task) => task.id.startsWith(taskId + ".") && task.id.split(".").length === taskId.split(".").length + 1,
            )

            if (subtasks.length > 0) {
              // This task has subtasks, create them
              addLogEntry(`Task ${taskId} planning complete, creating ${subtasks.length} subtasks`)
              simulateCreateSubtasks(taskId, subtasks)
            } else {
              // This is a leaf task, execute it
              addLogEntry(`Task ${taskId} planning complete, executing task`)
              simulateTaskExecution(taskId)
            }
          }
        } catch (err) {
          clearInterval(planningInterval)
          handleError(`Error in planning phase for task ${taskId}`, err)
        }
      }, 600)
    } catch (err) {
      handleError(`Error initializing planning for task ${taskId}`, err)
    }
  }

  const simulateCreateSubtasks = (parentId: string, subtasks: Task[]) => {
    try {
      const childIds = subtasks.map((task) => task.id)

      // Update parent to include children
      setTaskExecutions((prev) => {
        const parentTask = prev[parentId]
        if (!parentTask) return prev // Safety check

        return {
          ...prev,
          [parentId]: {
            ...parentTask,
            status: "waiting_for_children",
            children: childIds,
            result: {
              type: "plan",
              content: `Created ${childIds.length} subtasks`,
            },
          },
        }
      })

      // Create task executions for subtasks
      subtasks.forEach((task) => {
        setTaskExecutions((prev) => ({
          ...prev,
          [task.id]: {
            id: task.id,
            status: "pending",
            name: task.name,
            goal: task.goal,
            dependencies: task.dependencies || [],
            children: [],
            planningSteps: [],
            executionSteps: [],
            result: null,
          },
        }))
      })

      // Start executing subtasks that have their dependencies met
      const readySubtasks = subtasks.filter(
        (task) =>
          !task.dependencies ||
          task.dependencies.length === 0 ||
          task.dependencies.every((depId) => {
            const depTask = taskExecutions[depId]
            return (depTask && depTask.status === "completed") || depId === parentId // Consider parent as a satisfied dependency
          }),
      )

      // Execute ready subtasks in parallel with slight delays
      readySubtasks.forEach((task, index) => {
        setTimeout(
          () => {
            addLogEntry(`Starting task ${task.id} as dependencies are now met`)
            simulateTaskPlanning(task.id)
          },
          500 + index * 300,
        )
      })
    } catch (err) {
      handleError(`Error creating subtasks for ${parentId}`, err)
    }
  }

  const simulateTaskExecution = (taskId: string) => {
    try {
      // Update task status to executing
      setTaskExecutions((prev) => {
        const task = prev[taskId]
        if (!task) return prev // Safety check

        return {
          ...prev,
          [taskId]: {
            ...task,
            status: "executing",
          },
        }
      })

      // Simulate execution steps
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
            addLogEntry(`Task ${taskId} executing step: ${executionSteps[stepIndex].name}`)
            setTaskExecutions((prev) => {
              const task = prev[taskId]
              if (!task) return prev // Safety check

              return {
                ...prev,
                [taskId]: {
                  ...task,
                  executionSteps: [...(task.executionSteps || []), executionSteps[stepIndex]],
                },
              }
            })
            stepIndex++
          } else {
            clearInterval(executionInterval)

            // Generate a result based on the task ID
            const result = generateTaskResult(taskId)

            // Mark task as completed
            setTaskExecutions((prev) => {
              const task = prev[taskId]
              if (!task) return prev // Safety check

              return {
                ...prev,
                [taskId]: {
                  ...task,
                  status: "completed",
                  endTime: Date.now(),
                  result,
                },
              }
            })

            setActiveTaskIds((prev) => prev.filter((id) => id !== taskId))

            addLogEntry(`Task ${taskId} completed with result type: ${result.type}`)

            // Check if parent task can be completed
            const parentId = getParentTaskId(taskId)
            if (parentId) {
              checkAndCompleteParentTask(parentId)
            }

            // Check if any tasks depend on this task and can now be started
            checkDependentTasks(taskId)

            // Update overall progress
            updateProgress()
          }
        } catch (err) {
          clearInterval(executionInterval)
          handleError(`Error in execution phase for task ${taskId}`, err)
        }
      }, 1000)
    } catch (err) {
      handleError(`Error initializing execution for task ${taskId}`, err)
    }
  }

  // New function to check tasks that depend on a completed task
  const checkDependentTasks = (completedTaskId: string) => {
    try {
      // Get tasks that depend on the completed task
      const dependentTaskIds = taskDependencyMap[completedTaskId] || []

      if (dependentTaskIds.length > 0) {
        addLogEntry(`Checking ${dependentTaskIds.length} tasks that depend on ${completedTaskId}`)

        // For each dependent task, check if all its dependencies are now met
        dependentTaskIds.forEach((taskId) => {
          const task = taskExecutions[taskId]
          if (!task) {
            addLogEntry(`Task ${taskId} not found in taskExecutions, skipping`)
            return
          }

          // Skip if not in pending state
          if (task.status !== "pending") {
            addLogEntry(`Task ${taskId} is not pending (${task.status}), skipping`)
            return
          }

          // Check if all dependencies are completed
          const allDependenciesMet =
            task.dependencies?.every((depId) => {
              const depTask = taskExecutions[depId]
              return depTask && depTask.status === "completed"
            }) || false

          if (allDependenciesMet) {
            addLogEntry(`All dependencies for task ${taskId} are now met, starting task`)
            // Start the task with a slight delay
            setTimeout(() => simulateTaskPlanning(taskId), 500)
          } else {
            const pendingDeps = task.dependencies?.filter((depId) => {
              const depTask = taskExecutions[depId]
              return !depTask || depTask.status !== "completed"
            })
            addLogEntry(`Not all dependencies for task ${taskId} are met yet. Pending: ${pendingDeps?.join(", ")}`)
          }
        })
      } else {
        addLogEntry(`No tasks depend directly on ${completedTaskId}`)
      }

      // Also check for any other pending tasks that might be ready
      checkAndStartPendingTasks()
    } catch (err) {
      handleError(`Error checking dependent tasks for ${completedTaskId}`, err)
    }
  }

  // Enhance the generateTaskResult function with more detailed dummy data
  const generateTaskResult = (taskId: string) => {
    try {
      // Generate different types of results based on the task
      if (taskId.includes("1.1")) {
        return {
          type: "keywords",
          content: [
            "AI advancements",
            "machine learning",
            "neural networks",
            "GPT-4o",
            "AI ethics",
            "multimodal models",
            "reinforcement learning",
            "AI regulation",
          ],
        }
      } else if (taskId.includes("1.2")) {
        return {
          type: "search_queries",
          content: [
            "latest advancements in large language models 2025",
            "AI ethics developments recent news",
            "multimodal AI models breakthrough",
            "reinforcement learning from human feedback progress",
            "AI regulation updates global",
          ],
        }
      } else if (taskId.includes("1.3")) {
        return {
          type: "search_results",
          content: "Retrieved 27 relevant articles from trusted sources about recent AI developments",
        }
      } else if (taskId.includes("1.4")) {
        return {
          type: "filtered_articles",
          content: [
            "GPT-5 Capabilities Revealed: New Benchmark Results Show Significant Improvements",
            "EU AI Act Implementation: First Companies Receive Compliance Certification",
            "Multimodal AI Systems Show Promise in Medical Diagnostics",
            "Reinforcement Learning Breakthrough Enables More Efficient Training",
            "AI Ethics Board Releases Guidelines for Responsible Development",
          ],
        }
      } else if (taskId.includes("1.5")) {
        return {
          type: "summaries",
          content: `Recent AI advancements include the release of GPT-5 with significantly improved reasoning capabilities and multimodal understanding. The EU has begun implementing the AI Act with the first companies receiving compliance certification. Medical applications of multimodal AI systems have shown promising results in early diagnosis of conditions. A breakthrough in reinforcement learning has reduced the computational resources needed for training by 40%. The Global AI Ethics Board has released new guidelines for responsible AI development and deployment.`,
        }
      } else if (taskId.includes("2.1")) {
        return {
          type: "content_structure",
          content: [
            "1. Introduction: The rapidly evolving AI landscape",
            "2. Major Model Releases: GPT-5 and competitors",
            "3. Regulatory Developments: EU AI Act implementation",
            "4. Industry Applications: Healthcare breakthroughs",
            "5. Technical Innovations: Reinforcement learning efficiency",
            "6. Ethical Considerations: New guidelines and frameworks",
            "7. What's Next: Predictions for coming months",
          ],
        }
      } else if (taskId.includes("2.2")) {
        return {
          type: "styled_content",
          content: `# The AI Insider Newsletter
      
## The Rapidly Evolving AI Landscape

The past month has seen remarkable developments in artificial intelligence that are reshaping how we think about technology's role in society. From groundbreaking model releases to important regulatory milestones, the AI ecosystem continues to evolve at a breathtaking pace.

## Major Model Releases: GPT-5 Raises the Bar

OpenAI's release of GPT-5 has set new standards for what large language models can achieve. With a 40% improvement in reasoning tasks and enhanced multimodal capabilities, GPT-5 demonstrates significant advances in understanding complex instructions and generating more accurate, nuanced responses.`,
        }
      } else if (taskId.includes("2.3")) {
        return {
          type: "newsletter_draft",
          content: `# The AI Insider Newsletter
      
## The Rapidly Evolving AI Landscape

The past month has seen remarkable developments in artificial intelligence that are reshaping how we think about technology's role in society. From groundbreaking model releases to important regulatory milestones, the AI ecosystem continues to evolve at a breathtaking pace.

## Major Model Releases: GPT-5 Raises the Bar

OpenAI's release of GPT-5 has set new standards for what large language models can achieve. With a 40% improvement in reasoning tasks and enhanced multimodal capabilities, GPT-5 demonstrates significant advances in understanding complex instructions and generating more accurate, nuanced responses.

## Regulatory Developments: EU AI Act Implementation

The European Union has begun implementing its landmark AI Act, with the first wave of companies receiving compliance certification. This regulatory framework establishes clear guidelines for AI development while ensuring innovation can continue responsibly.

## Want to Learn More?

[Join our webinar on GPT-5 capabilities →](https://example.com/webinar)
[Read our in-depth analysis of the EU AI Act →](https://example.com/ai-act)
[Subscribe to our premium insights →](https://example.com/subscribe)`,
        }
      } else if (taskId.includes("3.1")) {
        return {
          type: "visual_mapping",
          content: [
            {
              section: "Major Model Releases",
              visualType: "comparison chart",
              description: "GPT-5 vs previous models performance metrics",
            },
            {
              section: "Regulatory Developments",
              visualType: "timeline",
              description: "EU AI Act implementation milestones",
            },
            {
              section: "Industry Applications",
              visualType: "infographic",
              description: "AI in healthcare diagnostic accuracy improvements",
            },
            {
              section: "Technical Innovations",
              visualType: "process diagram",
              description: "New reinforcement learning approach",
            },
          ],
        }
      } else if (taskId.includes("3.2")) {
        return {
          type: "visuals",
          content: "Generated 4 custom visuals: 1 comparison chart, 1 timeline, 1 infographic, and 1 process diagram",
          visualPreviews: [
            "Chart showing GPT-5 outperforming previous models by 40% on reasoning tasks",
            "Timeline of EU AI Act from proposal to implementation with key dates",
            "Infographic showing AI diagnostic accuracy improvements across 5 medical conditions",
            "Diagram illustrating the new reinforcement learning approach with 40% efficiency gain",
          ],
        }
      } else if (taskId.includes("4.1")) {
        return {
          type: "authentication",
          content: "Successfully authenticated with the mailing list provider API using secure credentials",
          details: {
            provider: "MailChimp",
            listSize: "1,245 subscribers",
            segmentation: "AI professionals (720), Researchers (325), General interest (200)",
          },
        }
      } else if (taskId.includes("5.1")) {
        return {
          type: "integrated_newsletter",
          content: "Newsletter successfully integrated with all text content and 4 visual elements",
          format: "Responsive HTML with plain text fallback",
          size: "127KB with optimized images",
        }
      } else if (taskId.includes("5.2")) {
        return {
          type: "email_sent",
          content: "Newsletter successfully sent to 1,245 subscribers with 98.5% delivery rate",
          metrics: {
            delivered: 1227,
            opened: 876,
            clickThrough: 342,
            bounced: 18,
          },
        }
      } else if (taskId === "1") {
        return {
          type: "research_results",
          content: "Completed research on latest AI developments with 5 key topics identified",
        }
      } else if (taskId === "2") {
        return {
          type: "newsletter",
          content: "Completed newsletter draft with 7 sections and 3 calls to action",
        }
      } else if (taskId === "3") {
        return {
          type: "visuals_package",
          content: "Completed visual package with 4 custom graphics optimized for newsletter format",
        }
      } else if (taskId === "4") {
        return {
          type: "mailing_list",
          content: "Successfully accessed mailing list with 1,245 subscribers across 3 segments",
        }
      } else if (taskId === "5") {
        return {
          type: "delivery_report",
          content: "Newsletter successfully delivered to 1,227 subscribers with 71% open rate",
        }
      } else {
        return {
          type: "task_output",
          content: `Output for task ${taskId}: Task completed successfully`,
        }
      }
    } catch (err) {
      console.error(`Error generating result for task ${taskId}:`, err)
      return {
        type: "error",
        content: `Error generating result: ${err instanceof Error ? err.message : "Unknown error"}`,
      }
    }
  }

  const getParentTaskId = (taskId: string) => {
    try {
      const parts = taskId.split(".")
      if (parts.length <= 1) return null
      return parts.slice(0, -1).join(".")
    } catch (err) {
      console.error(`Error getting parent ID for task ${taskId}:`, err)
      return null
    }
  }

  const checkAndCompleteParentTask = (parentId: string) => {
    try {
      const parent = taskExecutions[parentId]
      if (!parent || !parent.children || parent.children.length === 0) return

      // Check if all children are completed
      const allChildrenCompleted = parent.children.every((childId) => {
        const childTask = taskExecutions[childId]
        return childTask && childTask.status === "completed"
      })

      if (allChildrenCompleted && parent.status === "waiting_for_children") {
        addLogEntry(`All subtasks for ${parentId} completed, finalizing parent task`)

        // Compile results from children
        const childResults = parent.children
          .filter((childId) => taskExecutions[childId])
          .map((childId) => ({
            id: childId,
            name: taskExecutions[childId]?.name || `Task ${childId}`,
            result: taskExecutions[childId]?.result,
          }))

        // Update parent task
        setTaskExecutions((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            status: "completed",
            endTime: Date.now(),
            result: {
              type: "aggregated_results",
              content: `Aggregated results from ${childResults.length} subtasks`,
              childResults,
            },
          },
        }))

        setActiveTaskIds((prev) => prev.filter((id) => id !== parentId))

        // Check if parent's parent can be completed
        const grandparentId = getParentTaskId(parentId)
        if (grandparentId) {
          checkAndCompleteParentTask(grandparentId)
        }

        // Check if any tasks depend on this parent task
        checkDependentTasks(parentId)
      }
    } catch (err) {
      handleError(`Error completing parent task ${parentId}`, err)
    }
  }

  const checkAndStartPendingTasks = () => {
    try {
      // Find tasks that are pending and have all dependencies completed
      const pendingTasks = Object.values(taskExecutions).filter(
        (task) =>
          task &&
          task.id &&
          task.status === "pending" &&
          (!task.dependencies ||
            task.dependencies.length === 0 ||
            task.dependencies.every((depId) => {
              const depTask = taskExecutions[depId]
              return depTask && depTask.status === "completed"
            })),
      )

      if (pendingTasks.length > 0) {
        addLogEntry(`Found ${pendingTasks.length} pending tasks that can be started`)

        // Log the pending tasks for debugging
        pendingTasks.forEach((task) => {
          addLogEntry(`Ready to start: ${task.id} - ${task.name}`)
        })
      }

      // Start these tasks (with slight delays to visualize parallel execution)
      pendingTasks.forEach((task, index) => {
        if (!task || !task.id) return

        setTimeout(() => {
          addLogEntry(`Starting task ${task.id} as dependencies are now met`)
          simulateTaskPlanning(task.id)
        }, index * 300)
      })
    } catch (err) {
      handleError("Error starting pending tasks", err)
    }
  }

  // Special function to manually check and fix the 1.1 -> 1.2 dependency issue
  useEffect(() => {
    if (!isProcessing) return

    // Check if task 1.1 is completed and 1.2 is pending
    const task1_1 = taskExecutions["1.1"]
    const task1_2 = taskExecutions["1.2"]

    if (
      task1_1 &&
      task1_1.status === "completed" &&
      task1_2 &&
      task1_2.status === "pending" &&
      !activeTaskIds.includes("1.2")
    ) {
      // Check if all dependencies for 1.2 are met
      const allDependenciesMet =
        task1_2.dependencies?.every((depId) => {
          const depTask = taskExecutions[depId]
          return depTask && depTask.status === "completed"
        }) || false

      if (allDependenciesMet) {
        addLogEntry("Detected that task 1.1 is completed and 1.2 is ready - starting 1.2")
        setTimeout(() => simulateTaskPlanning("1.2"), 500)
      }
    }
  }, [taskExecutions, isProcessing, activeTaskIds])

  const updateProgress = () => {
    try {
      const totalTasks = dummyTasks.length
      const completedTasks = Object.values(taskExecutions).filter(
        (task) => task && task.status === "completed" && task.id !== "root",
      ).length

      const newProgress = Math.round((completedTasks / totalTasks) * 100)
      setProgress(newProgress)

      // Check if all done
      if (newProgress === 100) {
        addLogEntry("All tasks completed successfully!")
        setTimeout(() => {
          setIsProcessing(false)
        }, 1000)
      }
    } catch (err) {
      handleError("Error updating progress", err)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <CardContent className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
              <h3 className="font-bold mb-1">Error</h3>
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">AI Agent System</h2>
              <p className="text-gray-400">
                {!isProcessing ? "Ready to process your request" : `Executing tasks (${progress}% complete)`}
              </p>
            </div>

            <Button
              onClick={startProcess}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-700/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Execution
                </>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <Tabs defaultValue="tree" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-gray-800/50">
              <TabsTrigger value="tree">Task Tree</TabsTrigger>
              <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
              <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="mt-0">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
                <TaskTree taskExecutions={taskExecutions} activeTaskIds={activeTaskIds} />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
                <ExecutionTimeline taskExecutions={taskExecutions} />
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto font-mono text-sm">
                {executionLog.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">Execution logs will appear here</div>
                ) : (
                  <div className="space-y-1">
                    {executionLog.map((log, index) => (
                      <div key={index} className={`${log.includes("ERROR") ? "text-red-400" : "text-gray-300"}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
