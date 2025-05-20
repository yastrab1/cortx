export function getTaskResultPreview(content: any): string {
  if (!content) return "No content"
  try {
    if (typeof content === "string") {
      return content.length > 50 ? content.substring(0, 50) + "..." : content
    } else if (Array.isArray(content)) {
      return content.slice(0, 3).join(", ") + (content.length > 3 ? "..." : "")
    } else {
      return JSON.stringify(content).substring(0, 50) + "..."
    }
  } catch (e) {
    console.warn("Error generating result preview:", e)
    return "Complex content"
  }
} 