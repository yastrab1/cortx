import {z} from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import Docker, {Container} from 'dockerode';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {randomUUID} from "node:crypto";
import {Duplex} from "node:stream"
import {sessionManager} from "./SessionManager";
import * as readline from "node:readline";
import dotenv from 'dotenv';
dotenv.config();
import winston from 'winston';
import {write} from "node:fs";

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
console.log("Using docekr at ",process.env.DOCKER_HOST || '/var/run/docker.sock')
const docker = new Docker({
    socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock'
});


async function callTerminal(sessionId: string, command: string): Promise<string> {
    if (!sessionId) { // Should not happen if called with "1"
        return "No session ID provided";
    }
    const marker = randomUUID();
    // const escapedCommand = command.replace(/(["`\\$])/g, '\\$1');
    command = `${command}; echo "${marker}"`;

    try {
        const {container, stream} = await sessionManager.getOrCreate(sessionId);
        let outputBuffer = "";
        const outputCollector = new Promise<string>((resolve, reject) => {
            const dataListener = (chunk: Buffer) => {
                const text = chunk.toString();
                outputBuffer += text;
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
        logger.log({
            level:'info',
            message:"Calling terminal with command: "+command})
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

async function writeFile(sessionId:string, path: string, content: string) {
    if (!sessionId) return ["No session id provided"]
    console.log("Calling command +"`echo "${JSON.stringify(content).slice(1, -1)}" > ${path}`)

    const result = await callTerminal("1", `echo "${JSON.stringify(content).slice(1, -1)}" > ${path}`);
    return {
        content: [
            {
                type: "text",
                text: result
            }
        ]
    };
}

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

// server.tool(
//     "readFile",
//     {
//         path: z.string(),
//     },
//     async ({path}, extra: { sessionId?: string; }) => {
//         if (!extra.sessionId) return ["No session id provided"]
//         const result = await callTerminal("1", `cat ${path}`);
//         return {
//             content: [
//                 {
//                     type: "text",
//                     text: result
//                 }
//             ]
//         };
//     }
// )

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
            const result = await writeFile("1","test.py",command);
            logger.info("Returned:"+result);
            rl.close();
            resulve(result);
        }))
        logger.info("result",await questionPromise)
    }
}
main()