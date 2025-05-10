"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronRight, FileText, ImageIcon, List, Mail, Hash } from "lucide-react"
import type { TaskResult as TaskResultType } from "@/lib/types"

interface TaskResultProps {
  result: TaskResultType
}

export default function TaskResult({ result }: TaskResultProps) {
  // Defensive check at the component level
  if (!result || typeof result !== "object") {
    return (
      <div className="bg-gray-900/30 rounded border border-gray-800 p-2 mt-2">
        <div className="text-xs text-gray-500">Invalid result data</div>
      </div>
    )
  }

  const [expanded, setExpanded] = useState(false)

  const getResultIcon = () => {
    if (!result.type) return <FileText className="h-4 w-4 text-gray-400" />

    switch (result.type) {
      case "keywords":
        return <Hash className="h-4 w-4 text-blue-400" />
      case "search_queries":
        return <FileText className="h-4 w-4 text-blue-400" />
      case "search_results":
        return <FileText className="h-4 w-4 text-blue-400" />
      case "filtered_articles":
        return <FileText className="h-4 w-4 text-green-400" />
      case "summaries":
        return <FileText className="h-4 w-4 text-green-400" />
      case "content_structure":
        return <List className="h-4 w-4 text-purple-400" />
      case "styled_content":
        return <FileText className="h-4 w-4 text-purple-400" />
      case "newsletter_draft":
        return <FileText className="h-4 w-4 text-purple-400" />
      case "visual_mapping":
        return <ImageIcon className="h-4 w-4 text-pink-400" />
      case "visuals":
        return <ImageIcon className="h-4 w-4 text-pink-400" />
      case "authentication":
        return <Mail className="h-4 w-4 text-yellow-400" />
      case "integrated_newsletter":
        return <FileText className="h-4 w-4 text-green-400" />
      case "email_sent":
        return <Mail className="h-4 w-4 text-yellow-400" />
      case "aggregated_results":
        return <List className="h-4 w-4 text-blue-400" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getResultPreview = () => {
    if (!result.content) return "No content"

    try {
      if (typeof result.content === "string") {
        return result.content.length > 50 ? result.content.substring(0, 50) + "..." : result.content
      } else if (Array.isArray(result.content)) {
        return result.content.slice(0, 3).join(", ") + (result.content.length > 3 ? "..." : "")
      } else {
        return JSON.stringify(result.content).substring(0, 50) + "..."
      }
    } catch (e) {
      console.warn("Error generating result preview:", e)
      return "Complex content"
    }
  }

  const renderResultContent = () => {
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
                    {child.result?.type || "No type"}:{" "}
                    {typeof child.result?.content === "string"
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
        // Handle visual previews
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
        // Handle metrics display
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
        // Handle details display
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

  // Wrap the rendering in a try-catch block
  try {
    return (
      <div className="bg-gray-900/30 rounded border border-gray-800 p-2 mt-2">
        <div className="flex items-center text-xs cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-gray-400 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-400 mr-1" />
          )}

          <div className="flex items-center">
            {getResultIcon()}
            <span className="ml-1 font-medium text-gray-300">{result.type || "Unknown"}:</span>
            {!expanded && <span className="ml-1 text-gray-400">{getResultPreview()}</span>}
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {renderResultContent()}
        </motion.div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering task result:", error)
    return (
      <div className="bg-gray-900/30 rounded border border-red-800 p-2 mt-2">
        <div className="text-xs text-red-400">
          Error rendering result: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    )
  }
}
