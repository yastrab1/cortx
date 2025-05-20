import type { TaskExecution } from "@/lib/types"
import { TimelineTask } from "./TimelineTask"
import { getGroupName } from "../utils/timelineUtils"

interface TimelineGroupProps {
  parentId: string
  tasks: TaskExecution[]
  minTime: number
  duration: number
}

export const TimelineGroup = ({ parentId, tasks, minTime, duration }: TimelineGroupProps) => {
  const groupName = getGroupName(parentId, tasks[0])

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-300 mb-2">{groupName}</div>
      {tasks.map((task) => (
        <TimelineTask
          key={task.id}
          task={task}
          minTime={minTime}
          duration={duration}
        />
      ))}
    </div>
  )
} 