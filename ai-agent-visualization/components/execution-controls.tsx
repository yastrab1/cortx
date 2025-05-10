import { Button } from "@/components/ui/button"
import { Loader2, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ExecutionControlsProps {
  isProcessing: boolean
  progress: number
  onStart: () => void
  error: string | null
}

export function ExecutionControls({ isProcessing, progress, onStart, error }: ExecutionControlsProps) {
  return (
    <Card className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardContent className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
            <h3 className="font-bold mb-1">Error</h3>
            <p>{error}</p>
          </div>
        )}

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

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  )
} 