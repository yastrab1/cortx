import { CoreMessage, generateObject, generateText, experimental_createMCPClient as createMCPClient } from "ai";
import { google } from '@ai-sdk/google';
import { z } from "zod";
import { openai } from "@ai-sdk/openai"

const planSchema = z.object({
    plan: z.array(z.string()).describe("A list of distinct, sequential sub tasks to achieve the overall goal."),
    finalGoalComplete: z.boolean().describe("Set to true if the overall goal has been fully achieved based on the conversation history."),
    finalAnswer: z.string().describe("If 'isComplete' is true, provide the final answer or summary here.")
});

type planStructure = {
    plan: string[];
    finalGoalComplete: boolean;
    finalAnswer: string;
};

async function generatePlan(massages: CoreMessage[], originalPrompt: string): Promise<planStructure> {
    console.log("\n--- Generating Plan ---");

    const planPrompt: string = `Based on the original goal: "${originalPrompt}", and our conversation so far,` +
        ` split it to smaller subsequential sub tasks, output only the task that are needed from the point of this conversation.` +
        ` Set 'finalGoalComplete' to false and provide the final answer in the 'finalAnswer' field.`;
    
    const planMessage: CoreMessage = {
        role: "user",
        content: planPrompt,
    };

    let planMessages = [...massages, planMessage];

    const planResponse = await generateObject({
        // model: openai('o4-mini-2025-04-16'),
        model: google('gemini-2.5-flash-preview-04-17'),
        messages: planMessages,
        schema: planSchema,
    });

    const plan: planStructure = planResponse.object;

    if (plan.finalGoalComplete) {
        console.log("\n--- Goal Reported as Complete ---");
        if (plan.finalAnswer) {
            console.log("Final Answer:", plan.finalAnswer, plan);
        }
        return plan;
    }

    if (plan.plan.length === 0) {
        console.log("\n--- No Steps Provided ---");
        return plan;
    }

    console.log("\nFinished Plan:", plan.plan);
    return plan;
}

type ExecutionResult = {
    result: string;
    process: CoreMessage[];
}

async function executePlan(plan: string, originalPrompt: string, messages: CoreMessage[], maxIterations: number, mcpClient: any): Promise<ExecutionResult> {
    console.log("\n--- Executing Plan ---");

    const executePrompt: string = /*`Based on the original context: "${originalPrompt}", and the current subtask step: ` + */`This is task you are doing "${plan}",` +
    ` execute only what is the task and if finished subtask summarize the results of the planned subtask.` +
    ` If the task benefits from splitting into smaller task than call ai agent on the whole task` +
    ` with run-ai-agent with: ${plan} and some other context but say to it that it strictly should only do what is said in task.`;
    
    const executeMessage: CoreMessage = {
        role: "user",
        content: executePrompt,
    };

    let executeMessages = [...messages, executeMessage];
    let iterationCount = 0;

    while (iterationCount < maxIterations) {
        iterationCount++;
        console.log(`\n--- Execution Iteration ${iterationCount} ---`);

        const executeResponse = await generateText({
            model: openai('o4-mini-2025-04-16'),
            //model: google('gemini-2.0-flash-exp'),
            messages: executeMessages,
            tools: await mcpClient.tools(),
        });

        const toolResult = executeResponse.toolResults?.[0];
        const toolCall = executeResponse.toolCalls?.[0];

        if (!toolResult || !toolCall) {
            console.log("No tool result or call found. Assuming plan execution is complete. Final result: ", executeResponse.text);
            executeMessages.push({ role: 'assistant', content: executeResponse.text } as CoreMessage);
            return { result: executeResponse.text, process: executeMessages };
        }

        console.log("Intermidiate model thought: ", executeResponse.text, "");
        console.log("Called tool ", toolResult.toolName, "with args: ", toolCall.args, " and got result: ", toolResult.result, "");

        if (executeResponse.text) {
            executeMessages.push({
                role: 'assistant',
                content: executeResponse.text,
            } as CoreMessage);
        }

        executeMessages.push({
            role: 'assistant',
            content: [{
                type: 'tool-call',
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
            }],
        } as CoreMessage);
        executeMessages.push({
            role: 'tool',
            content: [{
                type: 'tool-result',
                toolCallId: toolResult.toolCallId,
                toolName: toolResult.toolName,
                result: toolResult.result,
            }],
        } as CoreMessage);
    }

    console.log("\n--- Max Iterations Reached ---");
    return { result: "", process: executeMessages };
}

export async function runAIAgent(originalPrompt: string, maxIterations: number, mcpClient: any): Promise<string> {
    console.log("\n--- Running AI Agent ---");

    const initialMessage = {
        role: "user",
        content: originalPrompt,
    } as CoreMessage;

    let messages = [initialMessage];
    let iterationCount = 0;

    while (iterationCount < maxIterations) {
        iterationCount++;
        console.log(`\n--- Run Iteration ${iterationCount} ---`);

        const planResponse = await generatePlan(messages, originalPrompt);

        if (planResponse.finalGoalComplete && false) {
            console.log("\n--- Goal Reported as Complete ---");
            if (planResponse.finalAnswer) {
                console.log("Final Answer:", planResponse.finalAnswer);
            }
            return planResponse.finalAnswer || "Goal completed without a final answer.";
        }

        const executionResponse = await executePlan(planResponse.plan[0], originalPrompt, messages, maxIterations, mcpClient);

        if (executionResponse.result) {
            const executionResultMessage = {
                role: 'assistant',
                content: executionResponse.result,
            } as CoreMessage;
            messages.push(executionResultMessage);
        }

        console.log("Finished run iteration with messages:", messages);
    }

    console.log("\n--- Max Iterations Reached ---");
    return "Max iterations reached without completing the goal.";
}

export async function createAIAgent(originalPrompt: string, maxIterations: number, port: number): Promise<string> {
    console.log("\n--- Creating AI Agent ---");
    console.log("Original Prompt:", originalPrompt);

    const agentMcpClient = await createMCPClient({
        transport: {
            type: "sse",
            url: `http://localhost:${port}/sse`,
        }
    });

    const prompt = originalPrompt + " Download any packages necessary, the os is ubuntu latest." +
    " To use terminal, use the terminal tool. Try your absolute hardest to fulfill this request. Optimize your terminal commands for non-interactivity" +
    " cause if there will be interactivity it will catastrofically end the process and kill the agent, try to use flags and so on. Don't use cat and other interactive commands." +
    " The terminal will hang and timeout when waiting for user input. You have full access trhough the terminal to whatever you want." +
    " To use ai agents give them detialed instructions of what actions to do and use the tool 'run-ai-agent'. Call new ai agent when ever the actions requires multiple steps.";

    const result = await runAIAgent(prompt, maxIterations, agentMcpClient);
    agentMcpClient.close();

    return result;
}