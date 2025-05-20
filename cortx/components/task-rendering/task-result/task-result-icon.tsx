import { FileText, ImageIcon, List, Mail, Hash } from "lucide-react"

interface TaskResultIconProps {
  type?: string
}

export function TaskResultIcon({ type }: TaskResultIconProps) {
  switch (type) {
    case "keywords":
      return <Hash className="h-4 w-4 text-blue-400" />
    case "search_queries":
    case "search_results":
      return <FileText className="h-4 w-4 text-blue-400" />
    case "filtered_articles":
    case "summaries":
    case "integrated_newsletter":
      return <FileText className="h-4 w-4 text-green-400" />
    case "content_structure":
      return <List className="h-4 w-4 text-purple-400" />
    case "styled_content":
    case "newsletter_draft":
      return <FileText className="h-4 w-4 text-purple-400" />
    case "visual_mapping":
    case "visuals":
      return <ImageIcon className="h-4 w-4 text-pink-400" />
    case "authentication":
    case "email_sent":
      return <Mail className="h-4 w-4 text-yellow-400" />
    case "aggregated_results":
      return <List className="h-4 w-4 text-blue-400" />
    default:
      return <FileText className="h-4 w-4 text-gray-400" />
  }
} 