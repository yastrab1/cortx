import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import Docker, {Container} from 'dockerode';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {randomUUID} from "node:crypto";

import {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol";
import {ServerNotification, ServerRequest} from "@modelcontextprotocol/sdk/types";
import * as readline from "node:readline";
import Stream from "node:stream";

import { createAIAgent } from "./../synapsis/ai";

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();
const docker = new Docker();

const sessions: { [sessionID: string]: {container:Container,stream:ReadWriteStream} } = {};

async function callTerminal(sessionId: string | undefined, command: string): Promise<string> {
    if (!sessionId) {
        return "No session ID provided"
    }
    const marker = randomUUID()

    const escapedCommand = command.replace(/(["`\\$])/g, '\\$1');

    // Wrap in eval and append marker
    command = `eval "${escapedCommand}"; echo "${marker}"`;


    // Create or retrieve container
    if (!sessions[sessionId]) {
        const container = await docker.createContainer({
            Image: 'cortx-compute:latest',
            Cmd: ['bash', "-l", "-i"],
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
        });

        await container.start();
        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true,
            hijack: true,
        });
        sessions[sessionId] = {container,stream};
    }

    const container = sessions[sessionId].container;
    const stream = sessions[sessionId].stream;


    let outputBuffer = "";
    // Send the command
    stream.write("\n" + command + "\n");
    // console.log(`[Executing command] ${command}`);

    // Collect output
    const outputCollector = new Promise<string>(resolve => {
        stream.on('data', chunk => {
            const text = chunk.toString();
            outputBuffer += text;
            // console.log(`[Received] ${text}`);
            if (outputBuffer.includes(`echo "${marker}"`)) {
                outputBuffer = outputBuffer.replace(`echo "${marker}"`, "");
            }
            if (outputBuffer.includes(marker)) {
                // console.log("Marking the end");
                stream.end()
            }
        });
        stream.on('end', () => {
            resolve(outputBuffer);
        })

    });

    return await outputCollector;
}

server.tool("terminal",
    {command: z.string()},
    async ({command}:{command:string}, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
        if (!extra.sessionId) return ["No session id provided"]
        const result = await callTerminal(extra.sessionId, command);

        return {
            content: [
                {
                    type: "text" as const,
                    text: result
                }
            ]
        } as const;
    }

}
server.tool("run-ai-agent",
    {
        prompt: z.string().describe("The prompt for the sub-agent to complete."),
        maxIterations: z.number().describe("Maximum iterations for the sub-agent run."),
    },
    async ({prompt, maxIterations}) => {
        const response = await createAIAgent(prompt, maxIterations, 3001);
        return { content: [{type: "text", text: response}] };
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

// async function dev() {
//     while (true) {
//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout
//         });
//
//         const questionPromise = new Promise(resulve => rl.question("Prompt:", async function (command) {
//             const result = await callTerminal("1",command);
//             console.log("Returned:"+result);
//             rl.close();
//             resulve(result);
//         }))
//         await questionPromise
//     }
// }
