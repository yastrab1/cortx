import AgentInterface from "@/components/agent-interface"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI Agent Execution
          </h1>
          <p className="text-gray-400 mb-8">
            Visualizing the recursive planning and parallel execution process of an AI agent system
          </p>

          <AgentInterface />
        </div>
      </main>
    </ThemeProvider>
  )
}
