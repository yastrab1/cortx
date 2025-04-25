import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import {generateText} from "ai";
import {experimental_createMCPClient} from "ai";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol";
import {ServerNotification, ServerRequest} from "@modelcontextprotocol/sdk/types";
import {openai} from "@ai-sdk/openai";
import {anthropic} from "@ai-sdk/anthropic";
import {google} from "@ai-sdk/google";
import {perplexity} from "@ai-sdk/perplexity";

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();

const modelRegistry = {
    "openai": ["gpt-3.5-turbo", "gpt-4", "gpt-4-32k"] as const,
    "google": ["gemini-pro", "gemini-1.5"] as const,
    "anthropic": ["claude-2", "claude-3-opus", "claude-3-sonnet"] as const,
};

const toolScopes = {
    "localhost:3000/sse": "cortx-browser" as const,
    "localhost:3001/sse": "cortx-terminal" as const
} as const

// TS magic
type PRIVATE_ToolScopeKeys = keyof typeof toolScopes;
type PRIVATE_ToolScopeValues = typeof toolScopes[PRIVATE_ToolScopeKeys];
const toolScopeKeys = Object.keys(toolScopes) as [PRIVATE_ToolScopeKeys, ...PRIVATE_ToolScopeKeys[]];
const toolScopeValues = Object.values(toolScopes) as [PRIVATE_ToolScopeValues, ...PRIVATE_ToolScopeValues[]];

const allModels = [
    ...modelRegistry.openai,
    ...modelRegistry.google,
    ...modelRegistry.anthropic,
] as const;

const ModelEnum = z.enum(allModels);
const toolsByTopic: never[] = []
async function initialize() {
        const toolsByTopic = []
    for (let i = 0; i < Object.keys(toolScopes).length; i++) {
        const server = await experimental_createMCPClient({
            transport: {
                type: "sse",
                url: Object.keys(toolScopes)[i], // Ensure your MCP server is running here
            }
        });
        const tools = await server.tools();
        toolsByTopic.push({
            toolset: tools,
            scope: Object.keys(toolScopes)[i]
        })
    }
}


server.tool("list_models", {
    systemPrompt: z.string(),
    task: z.string(),
    model: ModelEnum
}, async ({model, systemPrompt, task}) => {
    let i = 0;
    let provider = "";
    for (const modelList in Object.values(modelRegistry)) {
        if (modelList.includes(model)) {
            provider = Object.keys(modelRegistry)[i]
        }
        i += 1;
    }
    let providerObject = undefined;
    if (provider == "anthropic") {
        providerObject = anthropic
    } else if (provider == "openai") {
        providerObject = openai
    } else if (provider == "google") {
        providerObject = google
    } else if (provider == "perplexity") {
        providerObject = perplexity
    } else {
        return {
            content: [{
                type: "text" as const,
                text: `No models for ${model} are available`
            }]
        }
    }

    const agentLLM = providerObject(model)

    const result = await generateText({
        model: agentLLM,
        messages: [
            {role: "system", content: systemPrompt},
            {role: "user", content: task}
        ]
    })

    return {
        content: [{
            type: "text" as const,
            text: `Models for ${model} are`
        }]
    }
});

async function main() {
    await initialize();
    let transport: SSEServerTransport;

    app.get("/sse", async (req: Request, res: Response) => {
        transport = new SSEServerTransport("/messages", res);
        await server.connect(transport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
        await transport.handlePostMessage(req, res);
    });
    const port = 3001;
    app.listen(port, () => {
        console.log(`Printer Store MCP SSE Server is running on http://localhost:${port}/sse`);
        console.log("/sse")
        console.log("/messages")
    });
}
main()