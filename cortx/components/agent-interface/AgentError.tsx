interface AgentErrorProps {
  error: string | null;
}

export function AgentError({ error }: AgentErrorProps) {
  if (!error) return null;
  return (
    <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
      <h3 className="font-bold mb-1">Error</h3>
      <p>{error}</p>
    </div>
  );
} 