interface TaskTreeErrorProps {
  message: string
}

export function TaskTreeError({ message }: TaskTreeErrorProps) {
  return (
    <div className="text-center text-red-500 py-8 border border-red-500 rounded-md">
      <h3 className="font-bold mb-2">Error</h3>
      <p>{message}</p>
    </div>
  )
} 