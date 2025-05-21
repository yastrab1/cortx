import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext"; // Corrected path
import { Loader2, Play } from "lucide-react";

interface AgentHeaderProps {
  isProcessing: boolean;
  progress: number;
  onStart: () => void;
}

export function AgentHeader({ isProcessing, progress, onStart }: AgentHeaderProps) {
  const { user, login, logout, loading } = useAuth();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-white">AI Agent System</h2>
        <p className="text-gray-400">
          {!isProcessing ? "Ready to process your request" : `Executing tasks (${progress}% complete)`}
        </p>
      </div>
      <div className="flex items-center gap-4"> {/* Wrapper for buttons and auth status */}
        <div className="flex items-center gap-2 text-white">
          {loading && <p>Loading auth...</p>}
          {!loading && user && (
            <>
              <p className="text-sm text-gray-300 hidden md:block">Welcome, {user.email?.split('@')[0]}</p>
              <Button variant="outline" onClick={logout} className="bg-transparent hover:bg-gray-700 text-white border-gray-500">
                Logout
              </Button>
            </>
          )}
          {!loading && !user && (
            <Button variant="outline" onClick={login} className="bg-transparent hover:bg-gray-700 text-white border-gray-500">
              Login
            </Button>
          )}
        </div>
        <Button
          onClick={onStart}
          disabled={isProcessing || loading} // Disable if auth is loading
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
    </div>
  );
} 