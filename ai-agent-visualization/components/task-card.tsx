"use client"

import { motion } from "framer-motion"
import type { Task } from "@/lib/types"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TaskCardProps {
  task: Task
  isCompleted: boolean
  isExecuting: boolean
  isSubtask?: boolean
}

export default function TaskCard({ task, isCompleted, isExecuting, isSubtask = false }: TaskCardProps) {
  return (
    <motion.div
      className={`
        p-3 rounded-lg border 
        ${
          isCompleted
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : isExecuting
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        }
        ${isSubtask ? "text-sm" : ""}
      `}
      animate={{
        scale: isExecuting ? [1, 1.02, 1] : 1,
        transition: {
          scale: {
            repeat: isExecuting ? Number.POSITIVE_INFINITY : 0,
            duration: 2,
          },
        },
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            ) : isExecuting ? (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2 flex-shrink-0" />
            )}
            <h3 className={`font-medium ${isSubtask ? "text-sm" : ""} text-gray-800 dark:text-white`}>{task.name}</h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{task.goal}</p>

          {isExecuting && (
            <motion.div
              className="ml-6 mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <span className="mr-2">Processing</span>
                <motion.div
                  animate={{
                    x: [0, 10, 0],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.5,
                  }}
                >
                  <ArrowRight className="h-3 w-3" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              className="ml-6 mt-2 text-xs text-green-600 dark:text-green-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Task completed
            </motion.div>
          )}
        </div>

        {task.dependencies.length > 0 && (
          <div className="flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {task.dependencies.length} {task.dependencies.length === 1 ? "dependency" : "dependencies"}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  )
}
