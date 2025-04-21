import {CoreMessage, experimental_createMCPClient as createMCPClient, generateText, Tool, tool, ToolSet} from 'ai';
import {Experimental_StdioMCPTransport as StdioMCPTransport} from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';


import {createGoogleGenerativeAI} from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: "AIzaSyCVarjrsqlmhZkOxN2UwQUfTGlyQG8mxbU"
})

async function callMaster(messages: CoreMessage[], mcpClient: any) {
    const response = await generateText({
        model: google('gemini-2.0-flash-exp'),
        tools: await mcpClient.tools(),
        messages: messages,
    })
    const toolResult = response.toolResults?.[0];
    const toolCall = response.toolCalls?.[0];

    if (toolResult && toolCall) {
        const continuationMessages = [
            messages[0],messages[messages.length-1],
            {
                role: 'assistant',
                content: [{
                    type: 'tool-call',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    args: toolCall.args,
                }],
            } as CoreMessage,
            {
                role: 'tool',
                content: [{
                    type: 'tool-result',
                    toolCallId: toolResult.toolCallId,
                    toolName: toolResult.toolName,
                    result: toolResult.result,
                }],
            } as CoreMessage,
        ];


        return callMaster(continuationMessages, mcpClient)
    } else {
        return response.text
    }

}

async function main() {
    dotenv.config();
    // console.log("API key:", process.env.GOOGLE_GENERATIVEAI_API_KEY);
    const mcpClient = await createMCPClient({
        transport: {
            type: "sse",
            url: "http://localhost:3000/sse",
        }
    })
    const prompt = "Navigate to https://www.dennikn.sk/, then search for the latest news in slovakia" +
        "Give agenticBrowse a smaller, fine-grained instructions.NEVER USE agenticBrowse before navigating to a webpage. ALWAYS use GOTO tool before it"

    return callMaster([{role: 'user', content: [{type: 'text', text: prompt}]}], mcpClient)
};
main().then(r => console.log(r));