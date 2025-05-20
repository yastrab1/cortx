"use client"

import type { TaskExecution } from "@/lib/types"
import { useTimelineData } from "./hooks/useTimelineData"
import { TimelineHeader } from "./components/TimelineHeader"
import { TimelineGroup } from "./components/TimelineGroup"

interface ExecutionTimelineProps {
  taskExecutions: Record<string, TaskExecution>
}

export default function ExecutionTimeline({ taskExecutions }: ExecutionTimelineProps) {
  // Defensive check at the component level
  if (!taskExecutions || typeof taskExecutions !== "object") {
    return (
      <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
        <h3 className="font-bold mb-2">Error</h3>
        <p>Invalid task execution data</p>
      </div>
    )
  }

  const { tasks, minTime, maxTime, duration, groupedTasks, parentIds } = useTimelineData(taskExecutions)

  if (tasks.length === 0) {
    return <div className="text-center text-gray-500 py-8">Timeline will appear when tasks start executing</div>
  }

  return (
    <div>
      <TimelineHeader minTime={minTime} maxTime={maxTime} duration={duration} />

      {/* Group labels */}
      <div className="space-y-6 mt-8">
        {parentIds.map((parentId) => (
          <TimelineGroup
            key={parentId}
            parentId={parentId}
            tasks={groupedTasks[parentId]}
            minTime={minTime}
            duration={duration}
          />
        ))}
      </div>
    </div>
  )
} 