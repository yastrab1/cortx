interface ExecutionLogsProps {
  logs: string[]
}

export function ExecutionLogs({ logs }: ExecutionLogsProps) {
  return (
    <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto font-mono text-sm">
      {logs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">Execution logs will appear here</div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className={`${log.includes("ERROR") ? "text-red-400" : "text-gray-300"}`}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 