interface AgentLogProps {
  executionLog: string[];
}

export function AgentLog({ executionLog }: AgentLogProps) {
  if (!executionLog.length) {
    return <div className="text-gray-500 text-center py-8">Execution logs will appear here</div>;
  }
  return (
    <div className="space-y-1">
      {executionLog.map((log, index) => (
        <div key={index} className={log.includes("ERROR") ? "text-red-400" : "text-gray-300"}>
          {log}
        </div>
      ))}
    </div>
  );
} 