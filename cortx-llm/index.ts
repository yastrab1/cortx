import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import {experimental_createMCPClient, generateText, LanguageModel} from "ai";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";


const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();



async function main() {
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