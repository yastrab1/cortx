import type { TaskResult as TaskResultType } from "@/lib/types"

interface TaskResultContentProps {
  result: TaskResultType
  expanded: boolean
}

export function TaskResultContent({ result, expanded }: TaskResultContentProps) {
  if (!expanded || !result.content) return null

  try {
    if (typeof result.content === "string") {
      if (result.type === "newsletter_draft" || result.type === "styled_content") {
        return (
          <div className="mt-2 p-3 bg-gray-800/50 rounded text-xs text-gray-300 whitespace-pre-wrap">
            {result.content}
          </div>
        )
      }
      return <div className="mt-2 text-xs text-gray-300">{result.content}</div>
    } else if (Array.isArray(result.content)) {
      return (
        <div className="mt-2 space-y-1">
          {result.content.map((item, index) => (
            <div key={index} className="text-xs text-gray-300">
              • {typeof item === "string" ? item : JSON.stringify(item)}
            </div>
          ))}
        </div>
      )
    } else if (result.type === "aggregated_results" && result.childResults) {
      return (
        <div className="mt-2 space-y-2">
          {result.childResults
            .filter((child) => child && child.name)
            .map((child, index) => (
              <div key={index} className="text-xs p-2 bg-gray-800/50 rounded">
                <div className="font-medium text-gray-300">{child.name}</div>
                <div className="text-gray-400 mt-1">
                  {child.result?.type || "No type"}: {typeof child.result?.content === "string"
                    ? child.result.content.length > 50
                      ? child.result.content.substring(0, 50) + "..."
                      : child.result.content
                    : "Complex result"}
                </div>
              </div>
            ))}
        </div>
      )
    } else if (result.visualPreviews) {
      return (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-300">{result.content}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {result.visualPreviews.map((preview, index) => (
              <div key={index} className="p-2 bg-gray-800/50 rounded text-xs text-gray-400 border border-gray-700">
                {preview}
              </div>
            ))}
          </div>
        </div>
      )
    } else if (result.metrics) {
      return (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-300">{result.content}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(result.metrics).map(([key, value], index) => (
              <div
                key={index}
                className="flex justify-between p-2 bg-gray-800/50 rounded text-xs border border-gray-700"
              >
                <span className="text-gray-400">{key}:</span>
                <span className="text-gray-300 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )
    } else if (result.details) {
      return (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-300">{result.content}</div>
          <div className="space-y-1 mt-2">
            {Object.entries(result.details).map(([key, value], index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-400">{key}:</span>
                <span className="text-gray-300">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return <div className="mt-2 text-xs text-gray-300">{JSON.stringify(result.content, null, 2)}</div>
  } catch (error) {
    console.error("Error rendering result content:", error)
    return (
      <div className="mt-2 text-xs text-red-400">
        Error rendering result content: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    )
  }
} 