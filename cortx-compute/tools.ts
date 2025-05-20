import {McpServer} from "@modelcontextprotocol/sdk/dist/esm/server/mcp";
import {z} from "zod";
import {logger} from "./logger";
import {callTerminal, writeFile} from "./terminal";

export function defineTools(server: McpServer) {
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
}