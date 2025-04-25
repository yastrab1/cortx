import { CoreMessage, experimental_createMCPClient as createMCPClient, generateText, generateObject, Tool, tool, ToolSet } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { z } from 'zod'; // Import Zod for schema definition
import { createAIAgent, runAIAgent } from './ai';

// Load environment variables
dotenv.config();

async function main() {
    console.log("Starting agent with structured planning...");

    const mcpClient = await createMCPClient({
        transport: {
            type: "sse",
            url: "http://localhost:3001/sse",
        }
    });

    const originalPrompt = "You are a master model in a ai agent network. Your task is to create graph of tasks. Each task has a dependency list, that cannot be executed before those task.If you require tools, mock them. First, make just a draft. Then refine, until its good enough and add details. !ONLY SPLIT THE TASK PROVIDED IN THE USER INPUT, DO NOT PLAN AHEAD, THATS WHY YOU KNOW YOUR SUCCESSOR!Each task is in a format:\n" +
        "NAME:\n" +
        "GOAL: (the high level goal of that task)\n" +
        "Agent definition: (The system prompt of the agent, eg \"You are a master in writing newsletters, keep them concise\")\n" +
        "Output schema(optional)\n" +
        "Context(from its dependencies, you do not plan this part)\n" +
        "Dependencies:(the agents dependencies)\n" +
        "Successors:(the agents successors)\n" +
        "The prompt from the user was:\n" +
        "NAME: FetchLatestAIArticles\n" +
        "\n" +
        "GOAL: Retrieve the most recent AI-related news articles from configured sources.\n" +
        "\n" +
        "Agent definition: “You are an information-gathering agent specialized in crawling RSS feeds and APIs for AI news.”\n" +
        "\n" +
        "Dependencies: (none)\n" +
        "\n" +
        "Successors: FilterRelevantArticles";

    const result = await createAIAgent(originalPrompt, 10, 3001);
    console.log("Agent result:", result);
}

// Execute the main function
main().catch(console.error);