import { CoreMessage, generateObject } from "ai";
import { z } from "zod";
import { TaskData, TaskID, TaskStatus, TaskGeneralEvent, TaskStatusChangeEvent, ExecutionState, RawTask, RawPlan, TaskEvent, TaskCreatedEvent, TaskPlanningSubresults, TaskExecutionSubresults } from "../types";
import { AsyncQueue } from "./asyncQueue";
import { readFileSync } from "fs";
import { join } from "path";
import { resolveModel } from "./resolveModel";

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

const systemPrompt = readFileSync(join(__dirname, "plannerSystemPrompt.txt"), "utf-8");

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

    const systemMessage: CoreMessage = { role: "system", content: systemPrompt };
    const userMessage: CoreMessage = { role: "user", content: userPrompt };

    return [systemMessage, userMessage];
}

function rawTaskToTaskData(rawTask: RawTask): TaskData {
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
        status: "pending"
    };
}

function planArrayToDictionary(plans: RawPlan): { [key: string]: TaskData } {
    let planDictionary: { [key: string]: TaskData } = {};

    for (const task of plans.subtasks) {
        planDictionary[task.name] = rawTaskToTaskData(task);
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

export function postprocessResponse(plans: RawPlan): TaskData[] {
    let planDictionary = planArrayToDictionary(plans);

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

export async function generatePlan(taskID: TaskID, resultQueue: AsyncQueue<TaskGeneralEvent>, state: ExecutionState): Promise<void> {
    const task = state.tasks[taskID];
    if (!task) {
        throw new Error(`Task ${taskID} not found in state`);
    }

    // Started planning event
    const startedPlanningEvent: TaskStatusChangeEvent = {
        eventType: "TaskStatusChange",
        timestamp: Date.now().toString(),
        taskId: taskID,
        status: "planning",
        log: `[${Date.now().toString()}] Started planning task ${taskID}`
    };
    resultQueue.enqueue(startedPlanningEvent);

    const promptMessages = taskToMessages(task);
    // TODO: implement correct logging with events: console.log("Generating plan with ", promptMessages.map(message => message.content).join("\n"));
    
    const response = await generateObject({
        model: task.model || "gemini-2.0-flash",
        messages: promptMessages,
        schema: plannerOutputSchema,
    });

    if (!response.object) {
        throw new Error("Failed to generate plan");
    }

    const rawPlan = response.object as RawPlan;
    const plan = postprocessResponse(rawPlan);

    const planningSubresultsEvent: TaskPlanningSubresults = {
        eventType: "TaskPlanningSubresults",
        timestamp: Date.now().toString(),
        taskId: taskID,
        subresults: plan.map(task => task.name),
        log: `[${Date.now().toString()}] Generated plan for task ${taskID}`
    };
    resultQueue.enqueue(planningSubresultsEvent);

    for (const task of plan) {
        const taskCreatedEvent: TaskCreatedEvent = {
            eventType: "TaskCreated",
            timestamp: Date.now().toString(),
            taskId: task.id,
            taskData: task,
            log: `[${Date.now().toString()}] Created task ${task.id}`
        };
        resultQueue.enqueue(taskCreatedEvent);
    }

    const finishedTaskEvent: TaskStatusChangeEvent = {
        eventType: "TaskStatusChange",
        timestamp: Date.now().toString(),
        taskId: taskID,
        status: "completed",
        log: `[${Date.now().toString()}] Finished task ${taskID}`
    };
    resultQueue.enqueue(finishedTaskEvent);
}