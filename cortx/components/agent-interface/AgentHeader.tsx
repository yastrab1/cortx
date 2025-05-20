import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

interface AgentHeaderProps {
  isProcessing: boolean;
  progress: number;
  onStart: () => void;
}

export function AgentHeader({ isProcessing, progress, onStart }: AgentHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-white">AI Agent System</h2>
        <p className="text-gray-400">
          {!isProcessing ? "Ready to process your request" : `Executing tasks (${progress}% complete)`}
        </p>
      </div>
      <Button
        onClick={onStart}
        disabled={isProcessing}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-700/20"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Start Execution
          </>
        )}
      </Button>
    </div>
  );
} 