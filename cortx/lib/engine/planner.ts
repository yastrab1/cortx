import { CoreMessage, generateObject } from "ai";
import { z } from "zod";
import { TaskData, TaskID, TaskStatus, TaskGeneralEvent, TaskStatusChangeEvent, ExecutionState, RawTask, RawPlan, TaskEvent, TaskCreatedEvent, TaskPlanningSubresults, TaskPlanningResults, TaskExecutionSubresults } from "../types";
import { AsyncQueue } from "./asyncQueue";
import { readFileSync } from "fs";
import { join } from "path";
import { resolveModel } from "./resolveModel";
import { plannerSystemPrompt } from "./prompts";

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

const plannerOutputSchema = z.object({
    analysis: z.string(),
    subtasks: z.array(z.object({
        name: z.string(),
        goal: z.string(),
        dependencies: z.array(z.string()),
        agentDefinition: z.string(),
        context: z.array(z.string()),
        model: z.string()
    })),
    benefitFromSplitting: z.boolean(),
});

export function taskToString(task: TaskData): string {
    return `Task Name: ${task.name}\n` +
        `Goal: ${task.goal}\n` +
        `Dependencies: ${task.dependencies.join(", ")}\n` +
        `Agent Definition: ${task.agentDefinition}\n` +
        `Context: ${task.context.join(", ")}\n` +
        `Successors: ${task.upcomingTasks.join(", ")}`;
}

function taskToMessages(task: TaskData): CoreMessage[] {
    const userPrompt = taskToString(task);

    const systemMessage: CoreMessage = { role: "system", content: plannerSystemPrompt };
    const userMessage: CoreMessage = { role: "user", content: userPrompt };

    return [systemMessage, userMessage];
}

function rawTaskToTaskData(rawTask: RawTask, newDepth: number): TaskData {
    return {
        id: rawTask.name,
        name: rawTask.name,
        goal: rawTask.goal,
        dependencies: rawTask.dependencies,
        agentDefinition: rawTask.agentDefinition,
        context: rawTask.context,
        upcomingTasks: [],
        model: resolveModel(rawTask.model),
        planningSubresults: [],
        executionSubresults: [],
        planSubtasks: [],
        taskParent:null,
        taskResult: {
            type: "text",
            content: "",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        },
        taskCreationTime: Date.now(),
        taskStartTime: 0,
        taskEndPlanningTime: 0,
        taskEndExecutionTime: 0,
        taskEndTime: 0,
        expanded: false,
        depth: newDepth,
        status: "pending"
    };
}

function planArrayToDictionary(plans: RawPlan, newDepth: number): { [key: string]: TaskData } {
    let planDictionary: { [key: string]: TaskData } = {};

    for (const task of plans.subtasks) {
        planDictionary[task.name] = rawTaskToTaskData(task, newDepth);
    }

    return planDictionary;
}

function planDictionaryToArray(planDictionary: { [key: string]: TaskData }): TaskData[] {
    let plan: TaskData[] = [];

    for (const taskName in planDictionary) {
        plan.push(planDictionary[taskName]);
    }

    return plan;
}

export function postprocessResponse(plans: RawPlan, newDepth: number): TaskData[] {
    let planDictionary = planArrayToDictionary(plans, newDepth);

    for (const task of Object.values(planDictionary)) {
        for (const dependency of task.dependencies) {
            if (planDictionary[dependency]) {
                planDictionary[dependency].upcomingTasks.push(task.id);
            }

            // TODO: handle error
        }
    }

    return planDictionaryToArray(planDictionary);
}

export async function generatePlan(taskID: TaskID, resultQueue: AsyncQueue, state: ExecutionState, maxDepth: number): Promise<boolean> {
    const task = state.tasks[taskID];
    if (!task) {
        throw new Error(`Task ${taskID} not found in state`);
    }

    if (task.depth >= maxDepth) {
        // Skip to execution
        const startedPlanningEvent: TaskStatusChangeEvent = {
            eventType: "task_status_change",
            timestamp: getTime(),
            taskId: taskID,
            status: "executing",
            log: `[${getTime()}] Reached maximum depth for task ${taskID} - skipping to execution`
        };
        resultQueue.enqueue(startedPlanningEvent, state);

        return false;
    }

    // Started planning event
    const startedPlanningEvent: TaskStatusChangeEvent = {
        eventType: "task_status_change",
        timestamp: getTime(),
        taskId: taskID,
        status: "planning",
        log: `[${getTime()}] Started planning task ${taskID}`
    };
    resultQueue.enqueue(startedPlanningEvent, state);

    const promptMessages = taskToMessages(task);
    // TODO: implement correct logging with events: console.log("Generating plan with ", promptMessages.map(message => message.content).join("\n"));

    const response = await generateObject({
        model: task.model,
        messages: promptMessages,
        schema: plannerOutputSchema,
    });

    if (!response.object) {
        throw new Error("Failed to generate plan");
    }

    const rawPlan = response.object as RawPlan;
    const plan = postprocessResponse(rawPlan, task.depth + 1);

    const planningSubresultsEvent: TaskPlanningSubresults = {
        eventType: "task_planning_subresults",
        timestamp: getTime(),
        taskId: taskID,
        subresults: plan.map(task => task.name),
        log: `[${getTime()}] Generated plan for task ${taskID}`
    };
    resultQueue.enqueue(planningSubresultsEvent, state);

    for (const task of plan) {
        task.taskParent = taskID;
        const taskCreatedEvent: TaskCreatedEvent = {
            eventType: "task_created",
            timestamp: getTime(),
            taskId: task.id,
            taskData: task,
            log: `[${getTime()}] Created task ${task.id}`
        };
        resultQueue.enqueue(taskCreatedEvent, state);
    }

    const planningResultsEvent: TaskPlanningResults = {
        eventType: "task_planning_results",
        timestamp: getTime(),
        taskId: taskID,
        result: plan.map(task => task.id),
        log: `[${getTime()}] Planning subresults for task ${taskID}`
    };
    resultQueue.enqueue(planningResultsEvent, state);

    const finishedTaskEvent: TaskStatusChangeEvent = {
        eventType: "task_status_change",
        timestamp: getTime(),
        taskId: taskID,
        status: "executing",
        log: `[${getTime()}] Finished planning for task ${taskID}`
    };
    resultQueue.enqueue(finishedTaskEvent, state);

    return rawPlan.benefitFromSplitting;
}