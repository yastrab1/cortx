import {
    TaskData,
    ExecutionState,
    TaskID,
    TaskExecutionSubresults,
    TaskStatusChangeEvent,
    ExecutionResults,
    TaskResult
} from "../types"
import { runAgent } from "./agent";
import { AsyncQueue } from "./asyncQueue"
import {CoreMessage, generateText, streamText, ToolContent} from "ai";
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
    }).replace(',', '').replace(' at', ',')
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
    // state.tasks[taskID].taskResult.content
    const registry = await MCPRegistry.getInstance();
    let response = ""
    while (true) {
        console.log("while loop", taskID);
        const {textStream,toolResults,toolCalls} = streamText({
            model: task.model,
            messages: messages,
            tools: registry.getTools(),
            toolCallStreaming:false
        })

        for await (const chunk of textStream) {
            response += chunk;
            const subresultEvents: TaskExecutionSubresults = {
                eventType: "task_execution_subresults",
                timestamp: getTime(),
                taskId: taskID,
                log: `[${getTime()}] Subresults of task: ${taskID} with subresult: ${chunk}`,
                subresults: [chunk]
            };
            resultQueue.enqueue(subresultEvents, state);
        }
        const toolResult = await toolResults;
        const toolCall = await toolCalls;

        if (toolCall.length == 0 || toolResult.length == 0) {
            break;
        }

        for (const tool of toolResult) {
            messages.push({
                role: "user", // TODO: change to tool - but it causes errors so for now it's user
                content: JSON.stringify(tool)
            } as unknown as CoreMessage)
        }
    }

    resultQueue.enqueue({
        eventType: "task_execution_results",
        timestamp: getTime(),
        taskId: taskID,
        result: {
            type: "Response",
            content: response,
        } as TaskResult,
        log: `[${getTime()}] Sending execution results for task ${taskID}`
    } as ExecutionResults, state)

    resultQueue.enqueue({
        status: "completed",
        eventType: "task_status_change",
        timestamp: getTime(),
        taskId: taskID,
        log: `[${getTime()}] Finished execution for task ${taskID}`
    } as TaskStatusChangeEvent, state)
    if (state.tasks[taskID].taskParent != null) {
        let isAllCompleted = true;
        for (const task of state.tasks[state.tasks[taskID].taskParent].planSubtasks) {
            if (state.tasks[task].status !== "completed") {
                isAllCompleted = false;
                break;
            }
        }
        if (isAllCompleted){
            resultQueue.enqueue({
                status: "completed",
                eventType: "task_status_change",
                timestamp: getTime(),
                taskId: state.tasks[taskID].taskParent,
                log: `[${getTime()}] Finished execution for task ${taskID}`
            } as TaskStatusChangeEvent, state)
        }
    }


    for (const step of task.upcomingTasks) {
        state.tasks[step].context.push(task.taskResult.content); // TODO: change for real results
        if (state.tasks[step].dependencies.every(id => state.tasks[id].status === "completed")) {
            runAgent(step, resultQueue, state);
        }
    }
}