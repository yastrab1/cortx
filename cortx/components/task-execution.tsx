"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TaskCard from "./task-card"

interface TaskExecutionProps {
  isExecuting: boolean
  tasks: Task[]
  completedTasks: string[]
  executingTask: string | null
}

export default function TaskExecution({ isExecuting, tasks, completedTasks, executingTask }: TaskExecutionProps) {
  // Group tasks by their parent task
  const groupedTasks: Record<string, Task[]> = {}

  tasks.forEach((task) => {
    const parentId = task.id.split(".")[0]
    if (!groupedTasks[parentId]) {
      groupedTasks[parentId] = []
    }
    if (task.id.includes(".")) {
      groupedTasks[parentId].push(task)
    }
  })

  // Get main tasks (those without a dot in the ID)
  const mainTasks = tasks.filter((task) => !task.id.includes("."))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Task Execution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <AnimatePresence>
            {isExecuting &&
              mainTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { duration: 0.5 },
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <TaskCard
                    task={task}
                    isCompleted={completedTasks.includes(task.id)}
                    isExecuting={executingTask === task.id}
                  />

                  {/* Subtasks */}
                  <div className="pl-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 ml-4">
                    <AnimatePresence>
                      {groupedTasks[task.id.split(".")[0]]?.map((subtask) => (
                        <motion.div
                          key={subtask.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{
                            opacity: completedTasks.includes(task.id) ? 1 : 0.5,
                            x: 0,
                            transition: { duration: 0.3, delay: 0.2 },
                          }}
                        >
                          <TaskCard
                            task={subtask}
                            isCompleted={completedTasks.includes(subtask.id)}
                            isExecuting={executingTask === subtask.id}
                            isSubtask
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          {!isExecuting && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Start the execution to see tasks being processed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
