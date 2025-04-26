import { CoreMessage, generateObject, GenerateObjectResult } from "ai";
import { z } from "zod";
import { Plan, RawPlan, RawTask, Task } from "./types";

const plannerOutputSchema = z.object({
    subtasks: z.array(z.object({
        name: z.string(),
        goal: z.string(),
        dependencies: z.array(z.string()),
        agentDefinition: z.string(),
        context: z.string(),
    })),
});

export function taskToString(task: Task): string {
    return `Task Name: ${task.name}\n` +
        `Goal: ${task.goal}\n` +
        `Dependencies: ${task.dependencies.join(", ")}\n` +
        `Agent Definition: ${task.agentDefinition}\n` +
        `Context: ${task.context}\n` +
        `Upcoming Tasks: ${task.upcomingTasks.join(", ")}`;
}

function taskToMessages(task: Task): CoreMessage[] {
    const systemPrompt = "You are a task planner AI. Your job is to break down the given task into smaller subtasks.";
    const userPrompt = taskToString(task);

    const systemMessage: CoreMessage = { role: "system", content: systemPrompt };
    const userMessage: CoreMessage = { role: "user", content: userPrompt };

    return [systemMessage, userMessage];
}

function planArrayToDictionary(plans: RawPlan): { [key: string]: RawTask } {
    let planDictionary: { [key: string]: RawTask } = {};

    for (const task of plans.subtasks) {
        planDictionary[task.name] = task;
        planDictionary[task.name].model = task.model;
        planDictionary[task.name].upcomingTasks = [];
    }

    return planDictionary;
}

function planDictionaryToArray(planDictionary: { [key: string]: Task }): Plan {
    let plans: Plan = { subtasks: [] };

    for (const taskName in planDictionary) {
        plans.subtasks.push(planDictionary[taskName]);
    }

    return plans;
}

function emptyDependencyCopyTask(task: RawTask): Task {
    return {
        name: task.name,
        goal: task.goal,
        agentDefinition: task.agentDefinition,
        context: task.context,
        model: task.model,
        dependencies: [],
        upcomingTasks: [],
    }
}

function resolveDependenciesAndUpcomingToObjects(planDictionary: { [key: string]: RawTask }) {
    const parsedPlanDictionary: { [key: string]: Task } = {};
    for (const task of Object.values(planDictionary)) {
        parsedPlanDictionary[task.name] = emptyDependencyCopyTask(task);
        for (const dependencyName of task.dependencies) {
            const dependencyTask = planDictionary[dependencyName];
            if (!Object.keys(parsedPlanDictionary).includes(dependencyName)) {
                parsedPlanDictionary[task.name].dependencies.push(emptyDependencyCopyTask(dependencyTask))
            } else {
                parsedPlanDictionary[task.name].dependencies.push(parsedPlanDictionary[dependencyName])
            }
        }
        for (const upcomingName of task.upcomingTasks) {
            const dependencyTask = planDictionary[upcomingName];
            if (!Object.keys(parsedPlanDictionary).includes(upcomingName)) {
                parsedPlanDictionary[task.name].upcomingTasks.push(emptyDependencyCopyTask(dependencyTask))
            } else {
                parsedPlanDictionary[task.name].upcomingTasks.push(parsedPlanDictionary[upcomingName])
            }


        }
    }
    return parsedPlanDictionary;
}

export function postprocessResponse(plans: RawPlan): Plan {
    let rawPlanDictionary = planArrayToDictionary(plans);
    const planDictionary = resolveDependenciesAndUpcomingToObjects(rawPlanDictionary);

    for (const task of Object.values(planDictionary)) {
        for (const dependency of task.dependencies) {
            if (planDictionary[dependency.name]) {
                dependency.upcomingTasks.push(task);
            }
        }
    }

    return planDictionaryToArray(planDictionary);
}

export async function generatePlan(task: Task): Promise<Plan> {
    const promptMessages = taskToMessages(task);

    const { response } = await generateObject({
        model: task.model,
        messages: promptMessages,
        schema: plannerOutputSchema,
    });

    return postprocessResponse(response.body as RawPlan);
}