import TaskResult from "../task-result/task-result"

interface TaskNodeResultProps {
  status: string
  result: any
}

export function TaskNodeResult({ status, result }: TaskNodeResultProps) {
  if (status !== "completed" || !result) return null
  return (
    <div className="ml-6 mt-2">
      <TaskResult result={result} />
    </div>
  )
} 