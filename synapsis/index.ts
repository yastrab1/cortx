import { CoreMessage, experimental_createMCPClient as createMCPClient, generateText, generateObject, Tool, tool, ToolSet } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { z } from 'zod'; // Import Zod for schema definition
import { runAIAgent } from './ai';

// Load environment variables
dotenv.config();

// --- Define the Structured Output Schema for the Plan ---
const planSchema = z.object({
    plan: z.array(z.string()).describe("A list of distinct, sequential steps to achieve the overall goal."),
    finalGoalComplete: z.boolean().describe("Set to true if the overall goal has been fully achieved based on the conversation history."),
    finalAnswer: z.string().optional().describe("If 'isComplete' is true, provide the final answer or summary here.")
});

// --- Function to execute a single planned step, handling its internal tool calls ---
// This function's logic remains largely the same as it handles the dynamic
// interaction loop (AI proposes tool -> Call tool -> Send result back) for one step.
// It modifies the messages array in place.
async function executeSinglePlanStep(actionPrompt: string, messages: CoreMessage[], mcpClient: any): Promise<boolean> {
    console.log(`\n--- Executing Plan Step: ${actionPrompt} ---`);

    // Add the action prompt as the latest user message for this step's execution
    messages.push({ role: 'user', content: actionPrompt } as CoreMessage);

    const maxIterations = 3;
    let iterationCount = 0;

    let stepComplete = false;
    while (!stepComplete && iterationCount < maxIterations) {
        console.log(`\n--- Step Execution Iteration ${iterationCount + 1} ---`);
        iterationCount++;
        try {
            console.log("Calling model for step execution...");
            console.log("Current message history:", messages);

            const response = await generateText({
                model: google('gemini-2.0-flash-exp'),
                tools: await mcpClient.tools(),
                messages: messages,
            });

            console.log("Response: ", response.text);
            const toolResult = response.toolResults?.[0];
            const toolCall = response.toolCalls?.[0];

            if (toolResult && toolCall) {
                console.log("Called tool ", toolResult.toolName, "with args: ", toolCall.args, " and got result: ", toolResult.result, "");
                console.log("Intermidiate model thought: ", response.text, "");

                if (response.text) {
                    messages.push({
                        role: 'assistant',
                        content: response.text,
                    } as CoreMessage);
                }

                messages.push({
                    role: 'assistant',
                    content: [{
                        type: 'tool-call',
                        toolCallId: toolCall.toolCallId,
                        toolName: toolCall.toolName,
                        args: toolCall.args,
                    }],
                } as CoreMessage);
                messages.push({
                    role: 'tool',
                    content: [{
                        type: 'tool-result',
                        toolCallId: toolResult.toolCallId,
                        toolName: toolResult.toolName,
                        result: toolResult.result,
                    }],
                } as CoreMessage);
            }
            else {
                console.log("No tool result or call found. Assuming step is complete.");
                stepComplete = true;
                messages.push({
                    role: 'assistant',
                    content: response.text,
                } as CoreMessage);
            }
        }
        catch (error) {
            console.error("Error during step execution:", error);
            messages.push({
                role: 'tool',
                content: `An error occurred during step execution: ${error instanceof Error ? error.message : String(error)}. Please provide the next step.`,
            } as CoreMessage);
        }
    }

    console.log("--- Plan Step Execution Complete ---");
    return true; // Indicate success
}

async function run(originalPrompt: string) {
    const messages: CoreMessage[] = [];
    let goalCompleted = false;
    let finalAnswer = ""; // To store the final answer from the structured output

    // Add the original goal as the initial user message
    messages.push({ role: 'user', content: originalPrompt });
    console.log("Added original prompt to messages.");

    const maxIterations = 3; // Prevent infinite loops
    let iterationCount = 0; // Counter for iterations

    while (!goalCompleted && iterationCount < maxIterations) {
        console.log(`\n--- Iteration ${iterationCount + 1} ---`);
        iterationCount++;
        console.log("\n--- Requesting Updated Plan (Structured Output) ---");
        // Prompt the AI to provide the plan based on the full history,
        // explicitly mentioning the desired output structure.
        const planPrompt = `Based on the original goal: "${originalPrompt}", and our conversation so far, provide the remaining steps to achieve it as a list in the 'plan' array.Set 'finalGoalComplete' to false and provide the final answer in the 'finalAnswer' field.`;

        // Add the planning prompt to the messages history
        messages.push({ role: 'user', content: planPrompt } as CoreMessage);
        console.log("Added planning prompt to messages.");

        let planResponse;
        try {
            console.log("Calling model for planning with structured output...");

            planResponse = await generateObject({
                model: google('gemini-2.0-flash-exp'),
                messages: messages,
                schema: planSchema,
            });
            messages.pop();

            console.log("Assistant Plan Response (Object):", planResponse.object); // The structured data

            // Add the AI's response (text and a representation of the object) to history.
            // The SDK might automatically add the structured part, but adding the text is safe.
            //messages.push({ role: 'assistant', content: planResponse.text }); // Add any text response

            // --- Process the Structured Output ---
            const { plan, isComplete, finalAnswer } = planResponse.object;

            goalCompleted = isComplete;

            if (goalCompleted) {
                console.log("\n--- Goal Reported as Complete ---");
                if (finalAnswer) {
                    console.log("Final Answer:", finalAnswer);
                }
                break; // Exit the main loop
            }

            const currentPlanSteps = plan || []; // Use the 'plan' array from structured output

            if (currentPlanSteps.length > 0) {
                const nextAction = currentPlanSteps[0];

                if (nextAction) {
                    console.log("Next action from plan:", nextAction);
                    const success = await executeSinglePlanStep(nextAction, messages, mcpClient);
                    // Note: We could potentially handle 'success' here (e.g., retry step, replan).
                    // For simplicity, the loop will just ask for a new plan next based on history.

                    // Important: After executing the step, we *remove* it from the plan
                    // list *before* asking for the next plan. This helps the AI focus
                    // on the remaining work. However, the AI is asked for the *remaining*
                    // steps based on history, which is better. Let's rely on the AI
                    // to figure out the remaining steps in the next planning phase
                    // based on the state reflected in `messages`. No need to manage
                    // a `currentPlanSteps` list outside the planning response itself.

                } else {
                    console.warn("Parsed plan list was not empty, but the first element was undefined.");
                }

            } else {
                // If the plan is empty but the AI didn't say COMPLETE, maybe we're stuck?
                console.log("\n--- Plan was empty according to structured output, but goal not marked complete. Stopping. ---");
                // Add a message indicating the situation or ask for clarification
                messages.push({ role: 'user', content: "The plan provided was empty, but the goal is not marked complete. What should I do?" });
                // We could loop one more time or break. Let's break.
                break;
            }

        } catch (error) {
            console.error("\n--- Error during Planning Phase ---", error);
            // Handle errors during the planning phase (e.g., parsing error, API error)
            messages.push({
                role: 'tool', // Or user/system
                content: `An error occurred during planning: ${error instanceof Error ? error.message : String(error)}. Please provide the plan again.`,
            });
            // Do NOT break here immediately, the loop will continue, and the AI will see the error message.
            // This gives the AI a chance to correct itself or provide a new plan.
            // However, if errors persist, it might lead to an infinite loop.
            // A counter or a more sophisticated error handling strategy could be added.
        }
    }

    console.log("\n--- Agent Process Finished ---");
    console.log("\nFinal Message History:");
    // Log the final message history for review
    messages.forEach(msg => {
        // Basic logging, may not fully represent complex tool messages concisely
        const contentPreview = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content).substring(0, 150) + (JSON.stringify(msg.content).length > 150 ? '...' : '');
        console.log(`[${msg.role.toUpperCase()}] ${contentPreview}`);
    });

    if (goalCompleted && finalAnswer) {
        console.log("\nFinal Goal Answer:", finalAnswer);
    }
}

async function main() {
    console.log("Starting agent with structured planning...");

    const mcpClient = await createMCPClient({
        transport: {
            type: "sse",
            url: "http://localhost:3000/sse", // Ensure your MCP server is running here
        }
    });

    const originalPrompt = "Search the latest news in slovakia and print them in readable format. Download any packages necessary, the os is ubuntu latest." +
        "To use terminal, use the terminal tool. Download packages with the sudo apt -y command in terminal. DDGR is a command line tool. Try your absolute hardest to fulfill this request. Use only ddgr with the --json flag. Optimize your terminal commands for non-interactivity, try to use flags and so on. The terminal will hang and timeout when waiting for user input.";

    const result = await runAIAgent(originalPrompt, 3, mcpClient);
    console.log("Agent result:", result);
}

// Execute the main function
main().catch(console.error);