import { CoreMessage, generateObject, generateText } from "ai";
import { google } from '@ai-sdk/google';
import { z } from "zod";

const planSchema = z.object({
    plan: z.array(z.string()).describe("A list of distinct, sequential steps to achieve the overall goal."),
    finalGoalComplete: z.boolean().describe("Set to true if the overall goal has been fully achieved based on the conversation history."),
    finalAnswer: z.string().optional().describe("If 'isComplete' is true, provide the final answer or summary here.")
});

type planStructure = {
    plan: string[];
    finalGoalComplete: boolean;
    finalAnswer?: string;
};

async function generatePlan(massages: CoreMessage[], originalPrompt: string): Promise<planStructure> {
    console.log("\n--- Generating Plan ---");

    const planPrompt: string = `Based on the original goal: "${originalPrompt}", and our conversation so far, provide only the remaining steps to achieve the provided goal as a list in the 'plan' array.` +
        `Set 'finalGoalComplete' to false and provide the final answer in the 'finalAnswer' field.`;
    const planMessage: CoreMessage = {
        role: "user",
        content: planPrompt,
    };

    let planMessages = [...massages, planMessage];

    const planResponse = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        messages: planMessages,
        schema: planSchema,
    });

    const plan: planStructure = planResponse.object;

    if (plan.finalGoalComplete) {
        console.log("\n--- Goal Reported as Complete ---");
        if (plan.finalAnswer) {
            console.log("Final Answer:", plan.finalAnswer);
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

    const executePrompt: string = `Based on the original context: "${originalPrompt}", and the current plan step: "${plan}", execute only what is the plan and if finished plan summarize the results of the planned step.`;
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
            model: google('gemini-2.0-flash-exp'),
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