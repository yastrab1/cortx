import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import Docker, {Container} from 'dockerode';
import {Request, Response} from "express";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import * as tty from "node:tty";
import {randomUUID} from "node:crypto";

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();
const docker = new Docker();

const sessions: { [sessionID: string]: Container } = {};

server.tool("terminal",
    {command: z.string()},
    async ({command}, context) => {
        if (!context.sessionId) {
            return {content: [{type: "text", text: "No session id"}]}
        }
        const marker = randomUUID()
        command += ` ; echo "${marker}"`

        // Create or retrieve container
        if (!sessions[context.sessionId]) {
            const container = await docker.createContainer({
                Image: 'cortx-compute:latest',
                Cmd: ['bash',"-l","-i"],
                Tty: true,
                OpenStdin: true,
                StdinOnce: false,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
            });

            await container.start();
            sessions[context.sessionId] = container;
        }

        const container = sessions[context.sessionId];

        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true,
            hijack: true,
        });

        let outputBuffer = "";
        // Send the command
        stream.write(command + "\n");
        console.log(`[Executing command] ${command}`);

        // Collect output
        const outputCollector = new Promise<string>(resolve => {
            stream.on('data', chunk => {
                const text = chunk.toString();
                if (text.startsWith('{') && text.includes('stream')) return;
                outputBuffer += text;
                console.log(`[Received] ${text}`);
                if (outputBuffer.includes(`echo "${marker}"`)){
                    outputBuffer = outputBuffer.replace(`echo "${marker}"`, "");
                }
                if (outputBuffer.includes(marker)) {
                    console.log("Marking the end");
                    stream.end()
                }
            });
            stream.on('end', () => {
                resolve(outputBuffer);
            })

        });

        const result = await outputCollector;


        return {
            content: [{type: "text", text: result}]
        };
    }
);

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