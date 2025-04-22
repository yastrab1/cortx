import {CoreMessage, experimental_createMCPClient as createMCPClient, generateText, Tool, tool, ToolSet} from 'ai';
import {Experimental_StdioMCPTransport as StdioMCPTransport} from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';


import {createGoogleGenerativeAI, google} from '@ai-sdk/google';


async function callMaster(messages: CoreMessage[], mcpClient: any) {
    const response = await generateText({
        model: google('gemini-2.0-flash-001'),
        tools: await mcpClient.tools(),
        messages: messages,
    })
    console.log("Response: ", response.text)
    const toolResult = response.toolResults?.[0];
    const toolCall = response.toolCalls?.[0];

    if (toolResult && toolCall) {
        console.log("Called tool ",toolResult.toolName,"with args: ", toolCall.args, " and got result: ", toolResult.result, "");
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
    // const browser = await createMCPClient({
    //     transport: {
    //         type: "sse",
    //         url: "http://localhost:3000/sse",
    //     }
    // })
    const terminal = await createMCPClient({
        transport: {
            type: "sse",
            url: "http://localhost:3001/sse",
        }
    })
    // const browserTools = await browser.tools() as ToolSet;
    const terminalTools = await terminal.tools() as ToolSet;
    // const tools = [...browserTools, ...terminalTools] as ToolSet
    const prompt = "Use the ddgr python tool with pip to search the latest news articles in slovakia and print them in readable format. Download any packages necessary, the os is ubuntu latest" +
        "To use terminal, use the terminal tool. Try your absolute hardest to fulfill this request. Use only ddgr with the --json flag. Optimize your terminal commands for non-interactivity, try to use flags and so on. The terminal will hang and timeout when waiting for user input. To run python packages, use the python -m [name] [args]. To install python package, use python -m pip install [name]"

    return callMaster([{role: 'user', content: [{type: 'text', text: prompt}]}], terminal)
};
main().then(r => console.log(r));