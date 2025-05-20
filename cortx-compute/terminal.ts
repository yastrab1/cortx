import {randomUUID} from "node:crypto";
import {sessionManager} from "./SessionManager";

import {logger} from "./logger";

export async function callTerminal(sessionId: string, command: string): Promise<string> {
    if (!sessionId) {
        return "No session ID provided";
    }
    const marker = randomUUID();
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

export async function writeFile(sessionId: string, path: string, content: string) {
    if (!sessionId) return ["No session id provided"]
    console.log("Calling command " + `echo "${JSON.stringify(content).slice(1, -1)}" > ${path}`)

    const result = await callTerminal("1", `printf "${JSON.stringify(content).slice(1, -1)}" > ${path}`);
    return {
        content: [
            {
                type: "text",
                text: result
            }
        ]
    };
}