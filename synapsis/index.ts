import { CoreMessage, experimental_createMCPClient as createMCPClient, generateText, generateObject, Tool, tool, ToolSet } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { z } from 'zod'; // Import Zod for schema definition
import { runAIAgent } from './ai';

// Load environment variables
dotenv.config();

async function main() {
    console.log("Starting agent with structured planning...");

    const mcpClient = await createMCPClient({
        transport: {
            type: "sse",
            url: "http://localhost:3000/sse", // Ensure your MCP server is running here
        }
    });

    const originalPrompt = "Search the latest news in slovakia and print them in readable format. Download any packages necessary, the os is ubuntu latest." +
        "To use terminal, use the terminal tool. Download packages with the sudo apt -y command in terminal. DDGR is a command line tool. Try your absolute hardest to fulfill this request. Use only ddgr with the --json flag. Optimize your terminal commands for non-interactivity, try to use flags and so on. The terminal will hang and timeout when waiting for user input.";

    const result = await runAIAgent(originalPrompt, 3, mcpClient);
    console.log("Agent result:", result);
}

// Execute the main function
main().catch(console.error);