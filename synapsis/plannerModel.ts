import { CoreMessage, generateObject, GenerateObjectResult, LanguageModel } from "ai";
import { z } from "zod";

const plannerOutputSchema = z.object({
    subtasks: z.array(z.object({
        name: z.string(),
        goal: z.string(),
        dependencies: z.array(z.string()),
        agentDefinition: z.string(),
        context: z.string(),
    })),
});

type Task = {
    name: string;
    goal: string;
    dependencies: string[];
    agentDefinition: string;
    context: string;
    upcomingTasks: string[];
    model: LanguageModel;
}

type PlannerOutput = {
    subtasks: Task[];
}

function taskToString(task: Task): string {
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
    
    return[systemMessage, userMessage];
}

function planArrayToDictionary(plans: PlannerOutput): { [key: string]: Task } {
    let planDictionary: { [key: string]: Task } = {};
    
    for (const task of plans.subtasks) {
        planDictionary[task.name] = task;
        planDictionary[task.name].model = task.model;
        planDictionary[task.name].upcomingTasks = [];
    }

    return planDictionary;
}

function planDictionaryToArray(planDictionary: { [key: string]: Task }): PlannerOutput {
    let plans: PlannerOutput = { subtasks: [] };
    
    for (const taskName in planDictionary) {
        plans.subtasks.push(planDictionary[taskName]);
    }

    return plans;
}

function postprocessResponse(response: GenerateObjectResult<z.infer<typeof plannerOutputSchema>>): PlannerOutput {
    const plans = response.object as PlannerOutput;
    let planDictionary = planArrayToDictionary(plans);

    for (const task of plans.subtasks) {
        for (const dependency of task.dependencies) {
            if (planDictionary[dependency]) {
                task.upcomingTasks.push(dependency);
            }
        }
    }

    return planDictionaryToArray(planDictionary);
}

async function generatePlan(task: Task): Promise<PlannerOutput> {
    const promptMessages = taskToMessages(task);

    const plannerResponse = await generateObject({
        model: task.model,
        messages: promptMessages,
        schema: plannerOutputSchema,
    });

    const plan = postprocessResponse(plannerResponse);

    return plan;
}