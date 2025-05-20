interface AgentProgressBarProps {
  progress: number;
}

export function AgentProgressBar({ progress }: AgentProgressBarProps) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6 overflow-hidden">
      <div
        className="h-2.5 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
} 