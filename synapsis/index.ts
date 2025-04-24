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

    const originalPrompt = "List all primes untill 5000 and print them in readable format.";

    const result = await createAIAgent(originalPrompt, 10, 3001);
    console.log("Agent result:", result);
}

// Execute the main function
main().catch(console.error);