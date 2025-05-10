import { formatTime, formatDuration } from "../utils/timelineUtils"

interface TimelineHeaderProps {
  minTime: number
  maxTime: number
  duration: number
}

export const TimelineHeader = ({ minTime, maxTime, duration }: TimelineHeaderProps) => {
  return (
    <>
      <div className="mb-4 flex justify-between text-xs text-gray-500">
        <div>{formatTime(minTime)}</div>
        <div>Timeline Duration: {formatDuration(duration)}</div>
        <div>{formatTime(maxTime)}</div>
      </div>

      {/* Time markers */}
      <div className="relative h-6 mb-2">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="absolute top-0 h-full border-l border-gray-700 flex items-center"
            style={{ left: `${percent}%` }}
          >
            <span className="text-xs text-gray-500 ml-1">
              {formatTime(minTime + (duration * percent) / 100)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
} 