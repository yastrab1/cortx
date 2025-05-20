import { motion } from "framer-motion"
import type { TaskExecution } from "@/lib/types"
import { getTaskColor, getTaskWidth, getTaskLeft, formatDuration } from "../utils/timelineUtils"

interface TimelineTaskProps {
  task: TaskExecution
  minTime: number
  duration: number
}

export const TimelineTask = ({ task, minTime, duration }: TimelineTaskProps) => {
  if (!task?.id) return null

  const taskWidth = getTaskWidth(task, duration)
  const taskLeft = getTaskLeft(task, minTime, duration)
  const taskColor = getTaskColor(task)

  return (
    <div className="relative h-8 group">
      <div className="absolute left-0 top-0 h-full w-full bg-gray-800/30 rounded"></div>

      {/* Task execution bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{
          width: `${taskWidth}%`,
          x: `${taskLeft}%`,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`absolute top-0 h-full rounded bg-gradient-to-r ${taskColor} shadow-lg`}
        style={{ left: 0 }}
      >
        <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
          {task.name || `Task ${task.id}`}
        </div>
      </motion.div>

      {/* Planning phase indicator */}
      {task.planningSteps?.length > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: "5%",
            x: `${taskLeft}%`,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute top-0 h-full rounded-l bg-blue-500/50 border-r border-white/20"
          style={{ left: 0 }}
        />
      )}

      {/* Task details tooltip */}
      <div className="absolute left-1/2 bottom-full mb-2 bg-gray-800 rounded p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none transform -translate-x-1/2 w-64">
        <div className="font-medium">{task.name || `Task ${task.id}`}</div>
        <div className="text-gray-400 mt-1">{task.goal || "No goal specified"}</div>
        {task.startTime && task.endTime && (
          <div className="mt-1 text-gray-400">
            Duration: {formatDuration(task.endTime - task.startTime)}
          </div>
        )}
        {task.result && (
          <div className="mt-1 text-gray-400 truncate">
            Result:{" "}
            {typeof task.result.content === "string"
              ? task.result.content.length > 40
                ? task.result.content.substring(0, 40) + "..."
                : task.result.content
              : "Complex result"}
          </div>
        )}
      </div>
    </div>
  )
} 