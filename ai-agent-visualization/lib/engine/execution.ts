import { TaskData, ExecutionState, TaskID, TaskExecutionSubresults } from "../types"
import { runAgent } from "./agent";
import { AsyncQueue } from "./asyncQueue"
import { CoreMessage, generateText, ToolContent } from "ai";
import { runnerSystemPrompt } from "./prompts";
import { MCPRegistry } from "./mcp";

function getTime() {
    return new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).replace(',','').replace(' at', ',')
}

function taskToString(task: TaskData): string {
    return `Task Name: ${task.name}\n` +
        `Goal: ${task.goal}\n` +
        `Dependencies: ${task.dependencies.join(", ")}\n` +
        `Agent Definition: ${task.agentDefinition}\n` +
        `Context: ${task.context.join(", ")}\n` +
        `Successors: ${task.upcomingTasks.join(", ")}`;
}

function taskToMessages(task: TaskData): CoreMessage[] {
    const userPrompt = taskToString(task);

    const systemMessage: CoreMessage = { role: "system", content: runnerSystemPrompt };
    const userMessage: CoreMessage = { role: "user", content: userPrompt };

    return [systemMessage, userMessage];
}

export async function executeTask(taskID: TaskID, resultQueue: AsyncQueue, state: ExecutionState) {
    const task = state.tasks[taskID];
    const messages = taskToMessages(task);
    const registry = await MCPRegistry.getInstance();
    console.log("executing task", taskID);

    while (true) {
        const response = await generateText({
            model: task.model,
            messages: messages,
            tools: registry.getTools()
        })

        const toolResult: ToolContent[] = response.toolResults;
        const toolCall = response.toolCalls;
        const responseText = response.text;

        const subresultEvents: TaskExecutionSubresults = {
            eventType: "task_execution_subresults",
            timestamp: getTime(),
            taskId: taskID,
            log: `[${getTime()}] Subresults of task: ${taskID} with subresult: ${responseText}`,
            subresults: [responseText]
        };
        resultQueue.enqueue(subresultEvents, state);

        if (!toolResult || !toolCall) {
            break;
        }

        for (const tool of toolResult) {
            messages.push({
                role: "tool",
                content: tool
            } as unknown as CoreMessage)
        }
    }

    // TODO: first complete task, than do this chceck
    for (const step of task.upcomingTasks) {
        state.tasks[step].context.push(task.taskResult.type); // TODO: change for real results
        if (state.tasks[step].dependencies.every(id => state.tasks[id].status === "completed")) {
            runAgent(step, resultQueue, state);
        }
    }
}