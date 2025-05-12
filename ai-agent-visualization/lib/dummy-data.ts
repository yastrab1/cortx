import {TaskExecution} from "@/lib/types";

const taskExecution: TaskExecution = {
  id: "task-001",
  name: "Create AI Newsletter",
  goal: "Generate a weekly newsletter summarizing the latest developments in AI.",
  status: "completed",
  startTime: Date.now() - 1000 * 60 * 45, // 45 minutes ago
  endTime: Date.now(),
  planningSteps: [
    "Identify top AI news sources",
    "Gather top headlines from the week",
    "Summarize each news item",
    "Outline newsletter structure"
  ],
  executionSteps: [
    {
      name: "Fetch AI news headlines",
      output: "Retrieved 10 headlines from sources like OpenAI, DeepMind, and MIT Tech Review"
    },
    {
      name: "Summarize news content",
      output: "Generated concise summaries for each of the 10 news stories"
    },
    {
      name: "Assemble newsletter",
      output: "Formatted content with title, summaries, and links"
    },
    {
      name: "Finalize and export",
      output: "Newsletter exported to HTML and Markdown formats"
    }
  ],
  children: [],
  dependencies: [],
  result: {
    type: "newsletter",
    content: "Weekly AI Digest: OpenAI launches GPT-5 preview, DeepMind announces AlphaFold 3...",
    visualPreviews: ["https://example.com/preview1.png"],
    metrics: {
      headlineCount: 10,
      wordCount: 450,
      sourcesUsed: 5
    },
    details: {
      format: "HTML+Markdown",
      generatedBy: "GPT-4",
      durationMinutes: 45
    }
  }
};
