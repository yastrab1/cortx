import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import * as readline from "node:readline";
import {callTerminal, writeFile} from "./terminal";
import {logger} from "./logger";
import {randomUUID} from "node:crypto";
import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {isInitializeRequest} from "@modelcontextprotocol/sdk/types.js"

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                // Store the transport by session ID
                transports[sessionId] = transport;
            }
        });

        // Clean up transport when closed
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };
        const server = new McpServer({
            name: "cortx-compute",
            version: "1.0.0"
        });

// @ts-ignore
        server.tool(
            "terminal",
            {
                command: z.string()
            },
            async ({command}: { command: string }, extra: { sessionId?: string; }) => {
                if (!extra.sessionId) return ["No session id provided"]
                logger.log({
                    level: 'info',
                    message: "Calling terminal with command: " + command
                })
                const result = await callTerminal("1", command);
                return {
                    content: [
                        {
                            type: "text",
                            text: result
                        }
                    ]
                };
            }
        )

// @ts-ignore
        server.tool(
            "writeFile",
            {
                path: z.string(),
                content: z.string()
            },
            async ({path, content}, extra: { sessionId?: string; }) => {
                return await writeFile("1", path, content);
            }
        )
// @ts-ignore
        server.tool(
            "readFile",
            {
                path: z.string(),
            },
            async ({path}, extra: { sessionId?: string; }) => {
                if (!extra.sessionId) return ["No session id provided"]
                const result = await callTerminal("1", `cat ${path}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: result
                        }
                    ]
                };
            }
        )
        await server.connect(transport);
    } else {
        // Invalid request
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
            },
            id: null,
        });
        return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3000);

async function dev() {
    while (true) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const questionPromise = new Promise(resulve => rl.question("Prompt:", async function (command) {
            const result = await writeFile("1", "test.py", command);
            logger.info("Returned:" + result);
            rl.close();
            resulve(result);
        }))
        logger.info("result", await questionPromise)
    }
}