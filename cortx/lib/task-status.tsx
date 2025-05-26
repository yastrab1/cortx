import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import type { TaskStatus } from "./types"
import { ReactElement } from "react"

export const STATUS_COLORS: Record<string, string> = {
  "pending": "text-gray-400",
  "planning": "text-blue-400",
  "executing": "text-purple-400",
  "waiting_for_children": "text-yellow-400",
  "completed": "text-green-400",
  "failed": "text-red-400"
}

export const STATUS_ICONS: Record<string, ReactElement | null> = {
  "pending": null,
  "planning": <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
  "executing": <Loader2 className="h-4 w-4 animate-spin text-purple-400" />,
  "waiting_for_children": <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />,
  "completed": <CheckCircle2 className="h-4 w-4 text-green-400" />,
  "failed": <AlertCircle className="h-4 w-4 text-red-400" />
}