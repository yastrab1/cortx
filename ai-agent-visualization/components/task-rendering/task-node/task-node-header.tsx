import { STATUS_COLORS, STATUS_ICONS } from "@/lib/task-status"

interface TaskNodeHeaderProps {
  status: string
  name: string
  startTime?: number
  endTime?: number
}

export function TaskNodeHeader({ status, name, startTime, endTime }: TaskNodeHeaderProps) {
  return (
    <div className="flex items-center">
      {STATUS_ICONS[status]}
      <span className={`ml-2 font-medium ${STATUS_COLORS[status]}`}>{name}</span>
      {status !== "pending" && startTime && (
        <span className="ml-2 text-xs text-gray-500">{new Date(startTime).toLocaleTimeString()}</span>
      )}
      {status === "completed" && endTime && startTime && (
        <span className="ml-1 text-xs text-gray-500">
          - {new Date(endTime).toLocaleTimeString()} (
          {Math.round((endTime - startTime) / 1000)}s)
        </span>
      )}
    </div>
  )
} 