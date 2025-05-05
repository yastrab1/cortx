import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import Docker, {Container} from 'dockerode';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {randomUUID} from "node:crypto";
import {Duplex} from "node:stream"
import {sessionManager} from "./SessionManager";

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();
const docker = new Docker();



async function callTerminal(sessionId: string, command: string): Promise<string> {
    console.log(`[Handler] Process ID: ${process.pid}`);
    if (!sessionId) { // Should not happen if called with "1"
        return "No session ID provided";
    }
    const marker = randomUUID();
    const escapedCommand = command.replace(/(["`\\$])/g, '\\$1');
    command = `eval "${escapedCommand}"; echo "${marker}"`;

    try {
        // Use the new atomic method
        console.log(`[callTerminal] Calling sessionManager.getOrCreate for ID: '${sessionId}'`);
        const { container, stream } = await sessionManager.getOrCreate(sessionId);
        console.log(`[callTerminal] Got container/stream for ID: '${sessionId}'`);

        let outputBuffer = "";
        const outputCollector = new Promise<string>((resolve, reject) => {
            const dataListener = (chunk: Buffer) => {
                const text = chunk.toString();
                outputBuffer += text;
                if (outputBuffer.includes(marker)) {
                    stream.removeListener('data', dataListener);

                    const cleanOutput = outputBuffer.substring(0, outputBuffer.indexOf(`echo "${marker}"`)).trim();
                    outputBuffer = outputBuffer.replace(`echo "${marker}"`, "");
                    outputBuffer = outputBuffer.replace(marker, "");

                    console.log(`[callTerminal] Finished command`);
                    resolve(cleanOutput);
                }
            };
            stream.on('data', dataListener);
            stream.on('error', (err) => {
                console.error(`[callTerminal] Stream error for session ${sessionId}:`, err);
                stream.removeListener('data', dataListener);
                reject(err);
            });
            stream.on('end', () => {
                console.warn(`[callTerminal] Stream ended for session ${sessionId}`);
                stream.removeListener('data', dataListener);
            });

            // Send command
            stream.write("\n" + command + "\n");
        });

        return await outputCollector;

    } catch (error) {
        console.error(`[callTerminal] Error processing command for session ${sessionId}:`, error);

        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

server.tool(
    "terminal",
    {
        command: z.string()
    },
    async ({command}:{command:string}, extra: { sessionId?: string; }) => {
        if (!extra.sessionId) return ["No session id provided"]
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
