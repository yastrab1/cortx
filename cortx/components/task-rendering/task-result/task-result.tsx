"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { TaskResult as TaskResultType } from "@/lib/types"
import { TaskResultIcon } from "./task-result-icon"
import { getTaskResultPreview } from "./task-result-preview"
import { TaskResultContent } from "./task-result-content"

interface TaskResultProps {
  result: TaskResultType
}

export default function TaskResult({ result }: TaskResultProps) {
  if (!result || typeof result !== "object") {
    return (
      <div className="bg-gray-900/30 rounded border border-gray-800 p-2 mt-2">
        <div className="text-xs text-gray-500">Invalid result data</div>
      </div>
    )
  }

  const [expanded, setExpanded] = useState(false)

  try {
    return (
      <div className="bg-gray-900/30 rounded border border-gray-800 p-2 mt-2">
        <div className="flex items-center text-xs cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-gray-400 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-400 mr-1" />
          )}

          <div className="flex items-center">
            <TaskResultIcon type={result.type} />
            <span className="ml-1 font-medium text-gray-300">{result.type || "Unknown"}:</span>
            {!expanded && <span className="ml-1 text-gray-400">{getTaskResultPreview(result.content)}</span>}
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <TaskResultContent result={result} expanded={expanded} />
        </motion.div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering task result:", error)
    return (
      <div className="bg-gray-900/30 rounded border border-red-800 p-2 mt-2">
        <div className="text-xs text-red-400">
          Error rendering result: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    )
  }
}
