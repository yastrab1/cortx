import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import Docker, {Container} from 'dockerode';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {randomUUID} from "node:crypto";
import {Duplex} from "node:stream"
import {sessionManager} from "./SessionManager";
import * as readline from "node:readline";

import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

const app = express();
const docker = new Docker();


async function callTerminal(sessionId: string, command: string): Promise<string> {
    logger.info(`[Handler] Process ID: ${process.pid}`);
    if (!sessionId) { // Should not happen if called with "1"
        return "No session ID provided";
    }
    const marker = randomUUID();
    // const escapedCommand = command.replace(/(["`\\$])/g, '\\$1');
    command = `${command}; echo "${marker}"`;

    try {
        // Use the new atomic method
        logger.info(`[callTerminal] Calling sessionManager.getOrCreate for ID: '${sessionId}'`);
        const {container, stream} = await sessionManager.getOrCreate(sessionId);
        logger.info(`[callTerminal] Got container/stream for ID: '${sessionId}'`);

        let outputBuffer = "";
        const outputCollector = new Promise<string>((resolve, reject) => {
            const dataListener = (chunk: Buffer) => {
                const text = chunk.toString();
                outputBuffer += text;
                logger.info(`[callTerminal] Got data for session ${sessionId}:`, text);
                if (outputBuffer.includes(marker)) {
                    stream.removeListener('data', dataListener);
                    stream.removeListener('error', errorListener);
                    const cleanOutput = outputBuffer.substring(0, outputBuffer.indexOf(`echo "${marker}"`)).trim();
                    outputBuffer = outputBuffer.replace(`echo "${marker}"`, "");
                    outputBuffer = outputBuffer.replace(marker, "");

                    logger.info(`[callTerminal] Finished command`);
                    resolve(cleanOutput);
                }
            };
            const errorListener = (err: Error) => {
                logger.error(`[callTerminal] Stream error for session ${sessionId}:`, err);
                stream.removeListener('data', dataListener);
                stream.removeListener('error', errorListener);
                reject(err);
            };
            stream.on('data', dataListener);
            stream.on('error', errorListener)


            // Send command
            stream.write("\n" + command + "\n");
            logger.info(stream.listeners('error').length);
            logger.info(stream.listeners('end').length);
        });

        return await outputCollector;

    } catch (error) {
        logger.error(`[callTerminal] Error processing command for session ${sessionId}:`, error);

        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

server.tool(
    "terminal",
    {
        command: z.string()
    },
    async ({command}, extra: { sessionId?: string; }) => {
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

server.tool(
    "writeFile",
    {
        path: z.string(),
        content: z.string()
    },
    async ({path, content}, extra: { sessionId?: string; }) => {
        if (!extra.sessionId) return ["No session id provided"]
        const result = await callTerminal("1", `cat << EOF > ${path} \n  ${content}`);
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
        logger.info(`Printer Store MCP SSE Server is running on http://localhost:${port}/sse`);
        logger.info("/sse")
        logger.info("/messages")
    });
}

async function dev() {
    while (true) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const questionPromise = new Promise(resulve => rl.question("Prompt:", async function (command) {
            const result = await callTerminal("1",command);
            logger.info("Returned:"+result);
            rl.close();
            resulve(result);
        }))
        logger.info("result",await questionPromise)
    }
}
main()