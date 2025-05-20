import type { TaskResult } from '@/lib/types'

export const generateTaskResult = (taskId: string): TaskResult => {
  try {
    if (taskId.includes("1.1")) {
      return {
        type: "keywords",
        content: [
          "AI advancements",
          "machine learning",
          "neural networks",
          "GPT-4o",
          "AI ethics",
          "multimodal models",
          "reinforcement learning",
          "AI regulation",
        ],
      }
    } else if (taskId.includes("1.2")) {
      return {
        type: "search_queries",
        content: [
          "latest advancements in large language models 2025",
          "AI ethics developments recent news",
          "multimodal AI models breakthrough",
          "reinforcement learning from human feedback progress",
          "AI regulation updates global",
        ],
      }
    } else if (taskId.includes("1.3")) {
      return {
        type: "search_results",
        content: "Retrieved 27 relevant articles from trusted sources about recent AI developments",
      }
    } else if (taskId.includes("1.4")) {
      return {
        type: "filtered_articles",
        content: [
          "GPT-5 Capabilities Revealed: New Benchmark Results Show Significant Improvements",
          "EU AI Act Implementation: First Companies Receive Compliance Certification",
          "Multimodal AI Systems Show Promise in Medical Diagnostics",
          "Reinforcement Learning Breakthrough Enables More Efficient Training",
          "AI Ethics Board Releases Guidelines for Responsible Development",
        ],
      }
    } else if (taskId.includes("1.5")) {
      return {
        type: "summaries",
        content: `Recent AI advancements include the release of GPT-5 with significantly improved reasoning capabilities and multimodal understanding. The EU has begun implementing the AI Act with the first companies receiving compliance certification. Medical applications of multimodal AI systems have shown promising results in early diagnosis of conditions. A breakthrough in reinforcement learning has reduced the computational resources needed for training by 40%. The Global AI Ethics Board has released new guidelines for responsible AI development and deployment.`,
      }
    } else if (taskId.includes("2.1")) {
      return {
        type: "content_structure",
        content: [
          "1. Introduction: The rapidly evolving AI landscape",
          "2. Major Model Releases: GPT-5 and competitors",
          "3. Regulatory Developments: EU AI Act implementation",
          "4. Industry Applications: Healthcare breakthroughs",
          "5. Technical Innovations: Reinforcement learning efficiency",
          "6. Ethical Considerations: New guidelines and frameworks",
          "7. What's Next: Predictions for coming months",
        ],
      }
    } else if (taskId.includes("2.2")) {
      return {
        type: "styled_content",
        content: `# The AI Insider Newsletter
      
## The Rapidly Evolving AI Landscape

The past month has seen remarkable developments in artificial intelligence that are reshaping how we think about technology's role in society. From groundbreaking model releases to important regulatory milestones, the AI ecosystem continues to evolve at a breathtaking pace.

## Major Model Releases: GPT-5 Raises the Bar

OpenAI's release of GPT-5 has set new standards for what large language models can achieve. With a 40% improvement in reasoning tasks and enhanced multimodal capabilities, GPT-5 demonstrates significant advances in understanding complex instructions and generating more accurate, nuanced responses.`,
      }
    } else if (taskId.includes("2.3")) {
      return {
        type: "newsletter_draft",
        content: `# The AI Insider Newsletter
      
## The Rapidly Evolving AI Landscape

The past month has seen remarkable developments in artificial intelligence that are reshaping how we think about technology's role in society. From groundbreaking model releases to important regulatory milestones, the AI ecosystem continues to evolve at a breathtaking pace.

## Major Model Releases: GPT-5 Raises the Bar

OpenAI's release of GPT-5 has set new standards for what large language models can achieve. With a 40% improvement in reasoning tasks and enhanced multimodal capabilities, GPT-5 demonstrates significant advances in understanding complex instructions and generating more accurate, nuanced responses.

## Regulatory Developments: EU AI Act Implementation

The European Union has begun implementing its landmark AI Act, with the first wave of companies receiving compliance certification. This regulatory framework establishes clear guidelines for AI development while ensuring innovation can continue responsibly.

## Want to Learn More?

[Join our webinar on GPT-5 capabilities →](https://example.com/webinar)
[Read our in-depth analysis of the EU AI Act →](https://example.com/ai-act)
[Subscribe to our premium insights →](https://example.com/subscribe)`,
      }
    } else if (taskId.includes("3.1")) {
      return {
        type: "visual_mapping",
        content: [
          {
            section: "Major Model Releases",
            visualType: "comparison chart",
            description: "GPT-5 vs previous models performance metrics",
          },
          {
            section: "Regulatory Developments",
            visualType: "timeline",
            description: "EU AI Act implementation milestones",
          },
          {
            section: "Industry Applications",
            visualType: "infographic",
            description: "AI in healthcare diagnostic accuracy improvements",
          },
          {
            section: "Technical Innovations",
            visualType: "process diagram",
            description: "New reinforcement learning approach",
          },
        ],
      }
    } else if (taskId.includes("3.2")) {
      return {
        type: "visuals",
        content: "Generated 4 custom visuals: 1 comparison chart, 1 timeline, 1 infographic, and 1 process diagram",
        visualPreviews: [
          "Chart showing GPT-5 outperforming previous models by 40% on reasoning tasks",
          "Timeline of EU AI Act from proposal to implementation with key dates",
          "Infographic showing AI diagnostic accuracy improvements across 5 medical conditions",
          "Diagram illustrating the new reinforcement learning approach with 40% efficiency gain",
        ],
      }
    } else if (taskId.includes("4.1")) {
      return {
        type: "authentication",
        content: "Successfully authenticated with the mailing list provider API using secure credentials",
        details: {
          provider: "MailChimp",
          listSize: "1,245 subscribers",
          segmentation: "AI professionals (720), Researchers (325), General interest (200)",
        },
      }
    } else if (taskId.includes("5.1")) {
      return {
        type: "integrated_newsletter",
        content: "Newsletter successfully integrated with all text content and 4 visual elements",
        format: "Responsive HTML with plain text fallback",
        size: "127KB with optimized images",
      }
    } else if (taskId.includes("5.2")) {
      return {
        type: "email_sent",
        content: "Newsletter successfully sent to 1,245 subscribers with 98.5% delivery rate",
        metrics: {
          delivered: 1227,
          opened: 876,
          clickThrough: 342,
          bounced: 18,
        },
      }
    } else if (taskId === "1") {
      return {
        type: "research_results",
        content: "Completed research on latest AI developments with 5 key topics identified",
      }
    } else if (taskId === "2") {
      return {
        type: "newsletter",
        content: "Completed newsletter draft with 7 sections and 3 calls to action",
      }
    } else if (taskId === "3") {
      return {
        type: "visuals_package",
        content: "Completed visual package with 4 custom graphics optimized for newsletter format",
      }
    } else if (taskId === "4") {
      return {
        type: "mailing_list",
        content: "Successfully accessed mailing list with 1,245 subscribers across 3 segments",
      }
    } else if (taskId === "5") {
      return {
        type: "delivery_report",
        content: "Newsletter successfully delivered to 1,227 subscribers with 71% open rate",
      }
    } else {
      return {
        type: "task_output",
        content: `Output for task ${taskId}: Task completed successfully`,
      }
    }
  } catch (err) {
    console.error(`Error generating result for task ${taskId}:`, err)
    return {
      type: "error",
      content: `Error generating result: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
} 